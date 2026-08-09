// src\middlewares\validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate =
  (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      next(err);
    }
  };

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.header('API-KEY');
    const expectedKey = process.env.NAFATH_CALLBACK_API_KEY;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Missing API-KEY header',
      });
    }

    if (apiKey !== expectedKey) {
      return res.status(403).json({
        success: false,
        message: 'Invalid API-KEY',
      });
    }

    // Key is valid - proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error during API key validation',
    });
  }
};