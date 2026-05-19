/**
 * 에러 처리 및 재시도 메커니즘
 * 
 * 시스템 전체의 에러를 처리하고 재시도 로직을 관리합니다.
 * 
 * @author Hanjin Common Engine
 * @version 1.0.0
 */

import { logError, AuditLogCategory } from "./audit-log";

/**
 * 재시도 설정
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * 기본 재시도 설정
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * 지수 백오프를 사용한 재시도 함수
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: Error) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delayMs = Math.min(
          config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelayMs
        );

        console.log(
          `[Retry] Attempt ${attempt} failed, retrying in ${delayMs}ms: ${lastError.message}`
        );

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Webhook 재시도 로직
 */
export async function retryWebhook(
  webhookFn: () => Promise<void>,
  webhookType: string,
  eventId: string
): Promise<boolean> {
  try {
    await retryWithBackoff(
      webhookFn,
      {
        maxRetries: 5,
        initialDelayMs: 2000,
        maxDelayMs: 60000,
        backoffMultiplier: 2,
      },
      (attempt, error) => {
        console.log(
          `[Webhook] ${webhookType} (${eventId}) retry attempt ${attempt}: ${error.message}`
        );
      }
    );

    console.log(`[Webhook] ${webhookType} (${eventId}) succeeded`);
    return true;
  } catch (error) {
    console.error(
      `[Webhook] ${webhookType} (${eventId}) failed after all retries:`,
      error
    );

    // 최종 실패 로그
    if (error instanceof Error) {
      await logError(
        AuditLogCategory.WEBHOOK,
        "WEBHOOK_FAILED",
        error,
        {
          webhookType,
          eventId,
        }
      );
    }

    return false;
  }
}

/**
 * 이메일 발송 재시도 로직
 */
export async function retryEmailSend(
  emailFn: () => Promise<any>,
  email: string,
  emailType: string
): Promise<boolean> {
  try {
    await retryWithBackoff(
      emailFn,
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      (attempt, error) => {
        console.log(
          `[Email] ${emailType} to ${email} retry attempt ${attempt}: ${error.message}`
        );
      }
    );

    console.log(`[Email] ${emailType} to ${email} sent successfully`);
    return true;
  } catch (error) {
    console.error(
      `[Email] ${emailType} to ${email} failed after all retries:`,
      error
    );

    // 최종 실패 로그
    if (error instanceof Error) {
      await logError(
        AuditLogCategory.EMAIL,
        "EMAIL_SEND_FAILED",
        error,
        {
          email,
          emailType,
        }
      );
    }

    return false;
  }
}

/**
 * 데이터베이스 작업 재시도 로직
 */
export async function retryDatabaseOperation<T>(
  dbFn: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await retryWithBackoff(
      dbFn,
      {
        maxRetries: 3,
        initialDelayMs: 500,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      (attempt, error) => {
        console.log(
          `[Database] ${operationName} retry attempt ${attempt}: ${error.message}`
        );
      }
    );
  } catch (error) {
    console.error(
      `[Database] ${operationName} failed after all retries:`,
      error
    );

    if (error instanceof Error) {
      await logError(
        AuditLogCategory.ADMIN,
        "DATABASE_OPERATION_FAILED",
        error,
        {
          operationName,
        }
      );
    }

    throw error;
  }
}

/**
 * API 호출 재시도 로직
 */
export async function retryApiCall<T>(
  apiFn: () => Promise<T>,
  apiName: string,
  statusCodesToRetry: number[] = [408, 429, 500, 502, 503, 504]
): Promise<T> {
  try {
    return await retryWithBackoff(
      apiFn,
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      (attempt, error) => {
        console.log(
          `[API] ${apiName} retry attempt ${attempt}: ${error.message}`
        );
      }
    );
  } catch (error) {
    console.error(`[API] ${apiName} failed after all retries:`, error);

    if (error instanceof Error) {
      await logError(
        AuditLogCategory.ADMIN,
        "API_CALL_FAILED",
        error,
        {
          apiName,
        }
      );
    }

    throw error;
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
  console.error("[Error Handler] Unhandled error:", err);

  // 에러 로깅
  if (err instanceof Error) {
    logError(
      AuditLogCategory.ADMIN,
      "UNHANDLED_ERROR",
      err,
      {
        method: req.method,
        path: req.path,
        ip: req.ip,
      }
    ).catch((logError) => {
      console.error("[Error Handler] Failed to log error:", logError);
    });
  }

  // 응답 전송
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
}

/**
 * 에러 분류 함수
 */
export function classifyError(error: any): {
  isRetryable: boolean;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
} {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // 네트워크 에러 (재시도 가능)
    if (
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("timeout")
    ) {
      return {
        isRetryable: true,
        severity: "medium",
        category: "NETWORK_ERROR",
      };
    }

    // 데이터베이스 에러 (재시도 가능)
    if (
      message.includes("connection") ||
      message.includes("timeout") ||
      message.includes("deadlock")
    ) {
      return {
        isRetryable: true,
        severity: "high",
        category: "DATABASE_ERROR",
      };
    }

    // 인증 에러 (재시도 불가)
    if (message.includes("unauthorized") || message.includes("forbidden")) {
      return {
        isRetryable: false,
        severity: "medium",
        category: "AUTH_ERROR",
      };
    }

    // 검증 에러 (재시도 불가)
    if (message.includes("invalid") || message.includes("validation")) {
      return {
        isRetryable: false,
        severity: "low",
        category: "VALIDATION_ERROR",
      };
    }
  }

  // 기본값
  return {
    isRetryable: false,
    severity: "high",
    category: "UNKNOWN_ERROR",
  };
}

/**
 * 서킷 브레이커 패턴 구현
 */
export class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private lastFailureTime: number | null = null;

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000,
    private successThreshold: number = 2
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.resetTimeoutMs
      ) {
        this.state = "HALF_OPEN";
        this.successCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await fn();

      if (this.state === "HALF_OPEN") {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = "CLOSED";
          this.failureCount = 0;
          this.successCount = 0;
        }
      } else {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "OPEN";
      }

      throw error;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }
}
