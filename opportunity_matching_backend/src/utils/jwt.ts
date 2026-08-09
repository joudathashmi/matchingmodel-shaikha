// src\utils\jwt.ts
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dayjs from 'dayjs';

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || '';
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET || '';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export function signAccessToken(payload: object) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET);
}

export function parseExpiryToMs(exp: string) {
  // naive parser: accepts formats like "7d", "15m", "8h"
  const num = parseInt(exp.slice(0, -1), 10);
  const unit = exp.slice(-1);
  if (unit === 'd') return num * 24 * 60 * 60 * 1000;
  if (unit === 'h') return num * 60 * 60 * 1000;
  if (unit === 'm') return num * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export function getRefreshCookieOptions() {
  const maxAge = parseExpiryToMs(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d");

  let sameSite: "lax" | "strict" | "none" = "lax";
  if (process.env.REFRESH_COOKIE_SAME_SITE) {
    sameSite = process.env.REFRESH_COOKIE_SAME_SITE.toLowerCase() as any;
    if (sameSite === "none") {
      sameSite = "none"; // express-cookie accepts lowercase, but Chrome requires secure=true if sameSite=none
    }
  }

  const secure = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure,
    sameSite,
    // Path=/ so the cookie is visible site-wide; refresh still hits /api/auth/refresh
    path: process.env.REFRESH_COOKIE_PATH || "/",
    maxAge,
  };
}