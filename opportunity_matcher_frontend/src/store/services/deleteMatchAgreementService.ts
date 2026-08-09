import axiosClient from "../../api/axiosClient";

export interface DeleteMatchAgreementRequest {
  matchId: number;
}

export const deleteMatchAgreementService = {
  deleteMatchAgreement: async (requestData: DeleteMatchAgreementRequest): Promise<void> => {
    try {
      const response = await axiosClient.delete("/match-agreement", {
        data: requestData
      });
      return response.data;
    } catch (error) {
      console.error("❌ Delete match agreement failed:", error);
      throw error;
    }
  },
};