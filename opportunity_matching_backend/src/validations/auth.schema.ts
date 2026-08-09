// src\validations\auth.schema.ts
import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Invalid email address" }),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(20, { message: "Invalid or missing reset token" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
  }),
});
