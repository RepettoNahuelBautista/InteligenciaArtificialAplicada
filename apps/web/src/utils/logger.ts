interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDev = import.meta.env.DEV;

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.log(`[DEBUG] ${message}`, context);
    }
  }

  info(message: string, context?: LogContext) {
    console.log(`[INFO] ${message}`, context);
  }

  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context);
  }

  error(message: string, context?: LogContext) {
    console.error(`[ERROR] ${message}`, context);
  }
}

export const logger = new Logger();
