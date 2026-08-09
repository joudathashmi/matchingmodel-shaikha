import axiosClient from "../../api/axiosClient";
import {
  OpportunityInsight,
  OpportunityMarketIntelligenceData,
  OpportunityMarketIntelligenceMeta,
} from "../types/opportunityMarketIntelligenceTypes";

export interface OpportunityMIResponse {
  data: OpportunityMarketIntelligenceData;
  meta: OpportunityMarketIntelligenceMeta | null;
}

function splitMeta(raw: Record<string, unknown>): OpportunityMIResponse {
  const data: OpportunityMarketIntelligenceData = {};
  let meta: OpportunityMarketIntelligenceMeta | null = null;

  Object.entries(raw || {}).forEach(([key, value]) => {
    if (key === "_meta" && value && typeof value === "object" && !Array.isArray(value)) {
      meta = value as OpportunityMarketIntelligenceMeta;
      return;
    }
    if (Array.isArray(value)) {
      data[key] = value as OpportunityInsight[];
    }
  });

  return { data, meta };
}

export const opportunityMarketIntelligenceService = {
  getOpportunityMI: async (): Promise<OpportunityMIResponse> => {
    try {
      const response = await axiosClient.get<Record<string, unknown>>(
        `/ai-data/services/opportunity`
      );
      return splitMeta(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch opportunity market intelligence";
      throw new Error(errorMessage);
    }
  },
};

export default opportunityMarketIntelligenceService;
