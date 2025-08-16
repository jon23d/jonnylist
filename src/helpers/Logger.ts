/* eslint-disable no-console */

export class Logger {
  static debug(message: string, ...optionalParams: any[]) {
    console.debug(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  }

  static info(message: string, ...optionalParams: any[]) {
    console.info(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  }

  static log(message: string, ...optionalParams: any[]) {
    console.log(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  }

  static warn(message: string, ...optionalParams: any[]) {
    console.warn(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  }

  static error(message: string, ...optionalParams: any[]) {
    console.error(`[${new Date().toISOString()}] ${message}`, ...optionalParams);
  }
}
