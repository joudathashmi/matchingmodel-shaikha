import axiosClient from "../../api/axiosClient";
import { GetMatchAgreementsResponse } from "../types/getMatchAgreementsTypes";

export const getMatchAgreementsService = {
  getMatchAgreements: async (
    opts?: { scope?: "all" | "mine" }
  ): Promise<GetMatchAgreementsResponse> => {
    const params =
      opts?.scope === "all" ? { scope: "all" } : undefined;
    const response = await axiosClient.get<GetMatchAgreementsResponse>(
      "/match-agreement",
      { params }
    );
    return response.data;
  },
};
