type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.isDevelopment && level !== 'error') {
      return; // Only log errors in production
    }

    // In development: structured logs to console
    if (this.isDevelopment) {
      const color = {
        debug: '#6B7280',
        info: '#3B82F6',
        warn: '#F59E0B',
        error: '#EF4444',
      }[level];

      console.log(
        `%c[${level.toUpperCase()}]%c ${message}`,
        `color: ${color}; font-weight: bold`,
        'color: inherit',
        data || ''
      );
    } else {
      // In production: simple console.error for errors only
      if (level === 'error') {
        console.error(message, data);
        // TODO: Send to error tracking service (Sentry, LogRocket)
      }
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    this.log('error', message, errorData);
  }
}

export const logger = new Logger();
