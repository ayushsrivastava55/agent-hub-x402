import type { Request, Response, NextFunction } from 'express'

export type ErrorBody = {
  error: {
    code: string
    message: string
    requestId?: string
    details?: Record<string, unknown>
  }
}

export function sendError(res: Response, code: string, message: string, status = 400, details?: Record<string, unknown>) {
  const body: ErrorBody = {
    error: {
      code,
      message,
      requestId: (res.locals?.requestId as string | undefined) || undefined,
      details,
    },
  }
  return res.status(status).json(body)
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}
