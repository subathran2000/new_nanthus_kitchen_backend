import { LoggerService, LogLevel } from "@nestjs/common";

export class CustomLogger implements LoggerService {
  private context?: string;
  private readonly logLevels: LogLevel[] = [
    "log",
    "error",
    "warn",
    "debug",
    "verbose",
  ];

  constructor(context?: string) {
    this.context = context;
  }

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.printMessage("LOG", message, optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.printMessage("ERROR", message, optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.printMessage("WARN", message, optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      this.printMessage("DEBUG", message, optionalParams);
    }
  }

  verbose(message: string, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      this.printMessage("VERBOSE", message, optionalParams);
    }
  }

  private printMessage(
    level: string,
    message: string,
    optionalParams: unknown[],
  ): void {
    const timestamp = new Date().toISOString();
    const context =
      optionalParams.length > 0 && typeof optionalParams[0] === "string"
        ? optionalParams[0]
        : this.context;

    const logEntry = {
      timestamp,
      level,
      context,
      message,
      ...(optionalParams.length > 1 && { metadata: optionalParams.slice(1) }),
    };

    // In production, output JSON for log aggregation
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, use colored console output
      const colorMap: Record<string, string> = {
        LOG: "\x1b[32m", // Green
        ERROR: "\x1b[31m", // Red
        WARN: "\x1b[33m", // Yellow
        DEBUG: "\x1b[36m", // Cyan
        VERBOSE: "\x1b[35m", // Magenta
      };
      const reset = "\x1b[0m";
      const color = colorMap[level] || "";

      console.log(
        `${color}[${timestamp}] [${level}]${reset} ${context ? `[${context}] ` : ""}${message}`,
        optionalParams.length > 1 ? optionalParams.slice(1) : "",
      );
    }
  }
}

export const createLogger = (context?: string): CustomLogger => {
  return new CustomLogger(context);
};
