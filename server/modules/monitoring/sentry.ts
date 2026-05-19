/**
 * Sentry 모니터링 모듈
 * 
 * 한진 공통 엔진의 에러 추적 및 성능 모니터링을 Sentry를 통해 구현합니다.
 * - 프론트엔드 에러 추적
 * - 백엔드 에러 추적
 * - 성능 모니터링
 * - 이슈 감지 및 알림
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import type { Express } from "express";

/**
 * Sentry 초기화
 * 
 * @param app Express 앱 인스턴스
 */
export function initializeSentry(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    beforeSend(event, hint) {
      if (process.env.NODE_ENV === "development") {
        return event;
      }

      const error = hint.originalException;
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED")) {
          return null;
        }
      }

      return event;
    },
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());

  console.log("[Sentry] Initialized successfully");
}

/**
 * 에러 캡처
 * 
 * @param error 에러 객체
 * @param context 추가 컨텍스트
 * @param level 심각도 (fatal, error, warning, info, debug)
 */
export function captureException(
  error: Error | string,
  context?: Record<string, any>,
  level: Sentry.SeverityLevel = "error"
) {
  Sentry.captureException(error, {
    level,
    extra: context,
  });

  console.error(
    `[Sentry] Exception captured: ${error instanceof Error ? error.message : error}`
  );
}

/**
 * 메시지 캡처
 * 
 * @param message 메시지
 * @param level 심각도
 * @param context 추가 컨텍스트
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });

  console.log(`[Sentry] Message captured: ${message}`);
}

/**
 * 성능 모니터링 시작
 * 
 * @param name 작업명
 * @returns 트랜잭션 객체
 */
export function startTransaction(name: string) {
  const transaction = Sentry.startTransaction({
    name,
    op: "operation",
  });

  return transaction;
}

/**
 * 성능 모니터링 종료
 * 
 * @param transaction 트랜잭션 객체
 */
export function finishTransaction(transaction: Sentry.Transaction) {
  transaction.finish();
}

/**
 * 스팬 생성 (성능 측정)
 * 
 * @param transaction 트랜잭션 객체
 * @param operation 작업명
 * @param description 설명
 * @returns 스팬 객체
 */
export function createSpan(
  transaction: Sentry.Transaction,
  operation: string,
  description: string
) {
  return transaction.startChild({
    op: operation,
    description,
  });
}

/**
 * 스팬 종료
 * 
 * @param span 스팬 객체
 */
export function finishSpan(span: Sentry.Span) {
  span.finish();
}

/**
 * 사용자 컨텍스트 설정
 * 
 * @param userId 사용자 ID
 * @param email 이메일
 * @param name 이름
 */
export function setUserContext(
  userId: string | number,
  email?: string,
  name?: string
) {
  Sentry.setUser({
    id: userId.toString(),
    email,
    username: name,
  });
}

/**
 * 사용자 컨텍스트 제거
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * 추가 컨텍스트 설정
 * 
 * @param key 키
 * @param value 값
 */
export function setContext(key: string, value: Record<string, any>) {
  Sentry.setContext(key, value);
}

/**
 * 태그 설정
 * 
 * @param key 키
 * @param value 값
 */
export function setTag(key: string, value: string | number | boolean) {
  Sentry.setTag(key, value);
}

/**
 * 추가 데이터 설정
 * 
 * @param key 키
 * @param value 값
 */
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

/**
 * 데이터베이스 쿼리 성능 모니터링
 * 
 * @param query 쿼리
 * @param duration 실행 시간 (밀리초)
 */
export function captureDbQuery(query: string, duration: number) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

  if (transaction) {
    const span = transaction.startChild({
      op: "db.query",
      description: query.substring(0, 100),
    });

    span.setData("duration", duration);
    span.finish();
  }
}

/**
 * API 요청 성능 모니터링
 * 
 * @param method HTTP 메서드
 * @param url URL
 * @param statusCode 상태 코드
 * @param duration 실행 시간 (밀리초)
 */
export function captureApiRequest(
  method: string,
  url: string,
  statusCode: number,
  duration: number
) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

  if (transaction) {
    const span = transaction.startChild({
      op: "http.request",
      description: `${method} ${url}`,
    });

    span.setData("status_code", statusCode);
    span.setData("duration", duration);
    span.finish();
  }
}

/**
 * 외부 API 호출 성능 모니터링
 * 
 * @param service 서비스명
 * @param endpoint 엔드포인트
 * @param duration 실행 시간 (밀리초)
 * @param success 성공 여부
 */
export function captureExternalApiCall(
  service: string,
  endpoint: string,
  duration: number,
  success: boolean
) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

  if (transaction) {
    const span = transaction.startChild({
      op: "external.api",
      description: `${service} - ${endpoint}`,
    });

    span.setData("success", success);
    span.setData("duration", duration);
    span.finish();
  }
}

/**
 * 느린 작업 감지
 * 
 * @param name 작업명
 * @param duration 실행 시간 (밀리초)
 * @param threshold 임계값 (밀리초)
 */
export function captureSlowOperation(
  name: string,
  duration: number,
  threshold: number = 1000
) {
  if (duration > threshold) {
    captureMessage(
      `Slow operation detected: ${name} took ${duration}ms (threshold: ${threshold}ms)`,
      "warning",
      { name, duration, threshold }
    );
  }
}

/**
 * 메모리 사용량 모니터링
 */
export function captureMemoryUsage() {
  const memUsage = process.memoryUsage();

  setExtra("memory_usage", {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
  });
}

/**
 * 업타임 모니터링
 * 
 * @param startTime 시작 시간
 */
export function captureUptime(startTime: Date) {
  const uptime = Date.now() - startTime.getTime();
  const hours = Math.floor(uptime / 1000 / 60 / 60);
  const minutes = Math.floor((uptime / 1000 / 60) % 60);

  setExtra("uptime", `${hours}h ${minutes}m`);
}

/**
 * 에러 핸들러 미들웨어
 * 
 * @param err 에러 객체
 * @param req Express 요청
 * @param res Express 응답
 * @param next Express 다음 미들웨어
 */
export function errorHandler(
  err: any,
  req: any,
  res: any,
  next: any
) {
  Sentry.captureException(err, {
    contexts: {
      express: {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body,
      },
    },
  });

  res.status(500).json({
    error: "Internal Server Error",
    sentryId: Sentry.captureException(err),
  });
}

/**
 * 비동기 에러 핸들러
 * 
 * @param fn 비동기 함수
 */
export function asyncHandler(fn: any) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      captureException(error, {
        method: req.method,
        url: req.url,
      });
      next(error);
    });
  };
}
