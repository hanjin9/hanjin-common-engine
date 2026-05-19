/**
 * Sentry 모니터링 모듈 (v10 호환)
 * 
 * 한진 공통 엔진의 Sentry 에러 추적 및 성능 모니터링을 구현합니다.
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

/**
 * Sentry 초기화
 */
export function initializeSentry() {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    });

    console.log("[Sentry] Initialized successfully");
  } catch (error) {
    console.error("[Sentry] Initialization failed:", error);
  }
}

/**
 * Express 미들웨어 설정
 */
export function setupExpressMiddleware(app: any) {
  try {
    // Sentry Express integration
    app.use(Sentry.expressIntegration());
    console.log("[Sentry] Express middleware configured");
  } catch (error) {
    console.error("[Sentry] Express middleware setup failed:", error);
  }
}

/**
 * 트랜잭션 시작
 */
export function startTransaction(name: string, op: string = "http.request") {
  try {
    const transaction = Sentry.startSpan(
      {
        name,
        op,
      },
      () => {
        // Transaction logic
      }
    );

    console.log(`[Sentry] Transaction started: ${name}`);
    return transaction;
  } catch (error) {
    console.error("[Sentry] Error starting transaction:", error);
    return null;
  }
}

/**
 * 스팬 생성
 */
export function createSpan(
  parentSpan: any,
  name: string,
  op: string = "db.query"
) {
  try {
    const span = parentSpan?.startChild({
      name,
      op,
    });

    console.log(`[Sentry] Span created: ${name}`);
    return span;
  } catch (error) {
    console.error("[Sentry] Error creating span:", error);
    return null;
  }
}

/**
 * 사용자 컨텍스트 설정
 */
export function setUserContext(
  userId: number,
  email?: string,
  username?: string
) {
  try {
    Sentry.setUser({
      id: userId.toString(),
      email,
      username,
    });

    console.log(`[Sentry] User context set: ${userId}`);
  } catch (error) {
    console.error("[Sentry] Error setting user context:", error);
  }
}

/**
 * 추가 컨텍스트 설정
 */
export function setContext(key: string, value: Record<string, any>) {
  try {
    Sentry.setContext(key, value);

    console.log(`[Sentry] Context set: ${key}`);
  } catch (error) {
    console.error("[Sentry] Error setting context:", error);
  }
}

/**
 * 태그 설정
 */
export function setTag(key: string, value: string) {
  try {
    Sentry.setTag(key, value);

    console.log(`[Sentry] Tag set: ${key} = ${value}`);
  } catch (error) {
    console.error("[Sentry] Error setting tag:", error);
  }
}

/**
 * 에러 캡처
 */
export function captureException(error: Error, context?: Record<string, any>) {
  try {
    if (context) {
      Sentry.setContext("error_context", context);
    }

    Sentry.captureException(error);

    console.log("[Sentry] Exception captured:", error.message);
  } catch (err) {
    console.error("[Sentry] Error capturing exception:", err);
  }
}

/**
 * 메시지 캡처
 */
export function captureMessage(
  message: string,
  level: "fatal" | "error" | "warning" | "info" | "debug" = "info"
) {
  try {
    Sentry.captureMessage(message, level);

    console.log(`[Sentry] Message captured (${level}): ${message}`);
  } catch (error) {
    console.error("[Sentry] Error capturing message:", error);
  }
}

/**
 * 성능 모니터링 시작
 */
export function startPerformanceMonitoring(name: string) {
  try {
    const startTime = Date.now();

    return {
      end: () => {
        const duration = Date.now() - startTime;
        console.log(`[Sentry] Performance: ${name} took ${duration}ms`);

        Sentry.captureMessage(
          `${name} took ${duration}ms`,
          "info"
        );
      },
    };
  } catch (error) {
    console.error("[Sentry] Error starting performance monitoring:", error);

    return {
      end: () => {},
    };
  }
}

/**
 * Sentry 플러시
 */
export async function flushSentry(timeout: number = 2000) {
  try {
    await Sentry.close(timeout);
    console.log("[Sentry] Flushed successfully");
  } catch (error) {
    console.error("[Sentry] Error flushing:", error);
  }
}

/**
 * 에러 핸들러 미들웨어
 */
export function errorHandlerMiddleware(
  err: any,
  req: any,
  res: any,
  next: any
) {
  console.error("[Sentry] Unhandled error:", err);

  // Sentry에 에러 캡처
  Sentry.captureException(err, {
    contexts: {
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip,
      },
    },
  });

  // 응답 전송
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error",
      message:
        process.env.NODE_ENV === "development" ? err.message : undefined,
      eventId: Sentry.lastEventId(),
    });
  }
}
