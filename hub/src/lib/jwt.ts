import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { sendError } from './errors'

export function requireJwt() {
  const secret = process.env.HUB_JWT_SECRET
  const publicKey = process.env.HUB_JWT_PUBLIC_KEY
  if (!secret && !publicKey) {
    throw new Error('JWT middleware enabled without HUB_JWT_SECRET or HUB_JWT_PUBLIC_KEY')
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.header('authorization') || req.header('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return sendError(res, 'unauthorized', 'Missing bearer token', 401)
    }
    const token = auth.slice('Bearer '.length)
    try {
      const decoded = secret
        ? (jwt.verify(token, secret, { algorithms: ['HS256'] }) as jwt.JwtPayload)
        : (jwt.verify(token, publicKey as string, { algorithms: ['RS256'] }) as jwt.JwtPayload)
      // Optionally check audience/issuer in future
      res.locals.user = { sub: decoded.sub, raw: decoded }
      next()
    } catch (e: any) {
      return sendError(res, 'unauthorized', `Invalid token: ${e?.message || 'verify_failed'}`, 401)
    }
  }
}
