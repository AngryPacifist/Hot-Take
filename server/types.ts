import type { Request } from 'express';
import type { Session } from 'express-session';

export interface AuthenticatedRequest extends Request {
  session: Session & {
    userId?: string;
  };
}
