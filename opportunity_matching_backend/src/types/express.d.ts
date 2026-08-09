// src\types\express.d.ts
import { User } from "@prisma/client";

declare global {
  namespace Express {
    interface UserPayload {
      userId: string;
      email?: string;
      sessionId?: string;
      roles?: string[];
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
