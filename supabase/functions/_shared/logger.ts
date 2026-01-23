export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  [key: string]: any;
}

export class Logger {
  constructor(
    private functionName: string,
    private context: LogContext = {}
  ) {}

  private log(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      function: this.functionName,
      message,
      ...this.context,
      ...(data && { data }),
    };

    const logFn = level === LogLevel.ERROR ? console.error : console.log;
    logFn(JSON.stringify(logEntry));
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | any) {
    this.log(LogLevel.ERROR, message, {
      error: error?.message || String(error),
      stack: error?.stack,
    });
  }
}
