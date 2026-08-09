import axiosClient from "../../api/axiosClient";
import { ExecutiveOverviewData } from "../types/getExecutiveOverviewAiTypes";

export const executiveOverviewService = {
  getExecutiveOverviewData: async (): Promise<ExecutiveOverviewData> => {
    const response = await axiosClient.get("/ai-data/services/executiveOverview");
    return response.data;
  },
};