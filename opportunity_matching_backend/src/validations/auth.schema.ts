// src\validations\auth.schema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    name: z.string().min(1).optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  }),
});
