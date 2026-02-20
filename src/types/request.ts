import type { Request } from 'express';
import { JwtPayload } from './jwt';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}
