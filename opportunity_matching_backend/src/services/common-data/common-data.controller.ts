// src/controllers/common-data.controller.ts
import { Request, Response } from 'express';
import { CommonDataService } from '../common-data/common-data.service';

export class CommonDataController {
  static getClamp(req: Request, res: Response) {
    try {
      const { minSizePx, maxSizePx, minWidthPx, maxWidthPx } = req.body;

      if (minSizePx == null || maxSizePx == null || minWidthPx == null || maxWidthPx == null) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      const clampValue = CommonDataService.getClamp({minSizePx, maxSizePx, minWidthPx, maxWidthPx,});

      return res.json({ clamp: clampValue });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
