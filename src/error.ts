export default class DbError extends Error {
  protected adapter: string;
  constructor(namespace: string, adapter: string, message: string, err?: Error) {
    const msg = `${namespace}:${adapter}:${message}${err ? `:${err.message}` : ''}`;
    super(msg);
    this.name = 'DbError';
    this.message = msg;
    this.adapter = adapter;
    Object.setPrototypeOf(this, DbError.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DbError);
    }
  }
}