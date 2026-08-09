import axiosClient from "../../api/axiosClient";
import { Insight, MarketIntelligenceMeta } from "../types/MarketIntelligenceTypes";

export interface MarketIntelligenceApiResponse {
  [category: string]: Insight[] | MarketIntelligenceMeta;
}

export interface MarketIntelligenceResponse {
  categories: { [category: string]: Insight[] };
  meta: MarketIntelligenceMeta | null;
}

function splitMeta(raw: MarketIntelligenceApiResponse): MarketIntelligenceResponse {
  const categories: { [category: string]: Insight[] } = {};
  let meta: MarketIntelligenceMeta | null = null;

  Object.entries(raw || {}).forEach(([key, value]) => {
    if (key === "_meta" && value && typeof value === "object" && !Array.isArray(value)) {
      meta = value as MarketIntelligenceMeta;
      return;
    }
    if (Array.isArray(value)) {
      categories[key] = value as Insight[];
    }
  });

  return { categories, meta };
}

export const marketIntelligenceService = {
  getMarketIntelligence: async (): Promise<MarketIntelligenceResponse> => {
    try {
      const response = await axiosClient.get<MarketIntelligenceApiResponse>(
        `/ai-data/services/company`
      );
      return splitMeta(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch market intelligence";
      throw new Error(errorMessage);
    }
  },
};

export default marketIntelligenceService;
