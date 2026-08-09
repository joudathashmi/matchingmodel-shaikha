import rateLimit from "express-rate-limit";

/** Brute-force shield for credential endpoints (NCA auth hygiene). */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many sign-in attempts. Please try again in a few minutes.",
  },
  validate: { xForwardedForHeader: false },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset requests. Please try again later.",
  },
  validate: { xForwardedForHeader: false },
});

export const resetPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please try again later.",
  },
  validate: { xForwardedForHeader: false },
});
