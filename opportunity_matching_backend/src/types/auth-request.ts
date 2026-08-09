// src\types\auth-request.ts
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email?: string;
    sessionId?: string;
    roles?: string[];
  };
}