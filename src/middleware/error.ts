import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: { code: err.code, message: err.message },
      });
    }
  
    // body-parser JSON syntax errors carry their own statusCode
    if (err instanceof SyntaxError && 'statusCode' in err) {
      return res.status(400).json({
        error: { code: 'INVALID_JSON', message: 'Malformed JSON in request body' },
      });
    }
  
    console.error(err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
    });
  }