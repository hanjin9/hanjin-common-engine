import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ⚠️ Stripe webhook MUST be registered BEFORE express.json()
  // because it needs raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const { handleStripeWebhook } = await import("../modules/payment/stripeWebhook");
      return handleStripeWebhook(req, res);
    }
  );

  // ─── Stripe REST API 엔드포인트 (jangbu + sports 레포 이식) ─────────────────
  // 결제 세션 검증 (PaymentSuccess 페이지에서 호출)
  app.get("/api/stripe/verify-session", async (req, res) => {
    try {
      const sessionId = req.query.session_id as string;
      if (!sessionId) return res.json({ success: false, error: "session_id required" });

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return res.json({ success: false, error: "Stripe not configured" });

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey);
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid" || session.status === "complete") {
        res.json({
          success: true,
          order: {
            tier_key: session.metadata?.tier_key,
            tier_name: session.metadata?.tier_name || session.metadata?.tier_id,
            project_slug: session.metadata?.project_slug,
            amount: session.amount_total,
            stripe_subscription_id: session.subscription,
          },
        });
      } else {
        res.json({ success: false, status: session.payment_status });
      }
    } catch (error: any) {
      console.error("[Stripe verify-session]", error.message);
      res.status(500).json({ success: false, error: "결제 검증 실패" });
    }
  });

  // ─── Heartbeat 스케줄러 엔드포인트 ───────────────────────────────────────────
  // 일일 미션 자동 발송 (매일 KST 10:00)
  app.post("/api/scheduled/daily-mission", async (req, res) => {
    const { handleDailyMissionPush } = await import("../modules/scheduler/missionScheduler");
    return handleDailyMissionPush(req, res);
  });

  // 주간 미션 리포트 (매주 월요일 KST 09:00)
  app.post("/api/scheduled/weekly-mission-report", async (req, res) => {
    const { handleWeeklyMissionReport } = await import("../modules/scheduler/missionScheduler");
    return handleWeeklyMissionReport(req, res);
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
