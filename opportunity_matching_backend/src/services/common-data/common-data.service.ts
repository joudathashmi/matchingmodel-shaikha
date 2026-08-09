// src/services/common-data.service.ts
import { generateClamp } from '../../utils/clampUtil';

interface ClampInput {
  minSizePx: number;
  maxSizePx: number;
  minWidthPx: number;
  maxWidthPx: number;
}

export class CommonDataService {
  static getClamp(input: ClampInput): string {
    return generateClamp(input.minSizePx, input.maxSizePx, input.minWidthPx, input.maxWidthPx);
  }
}