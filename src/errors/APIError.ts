/*
 * API error class
 */
export class APIError extends Error {
  name = 'APIError';

  /**
   * @param code - Код ошибки
   * @param message - Сообщение ошибки
   */
  constructor(code: number, message: string) {
    super(`Code ${code}: ${message}`);

    Error.captureStackTrace(this, this.constructor);
  }
}
