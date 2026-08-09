import axiosClient from "../../api/axiosClient";
import { Company } from "../types/actionCompanyTypes";

export const actionCompanyService = {
  getCompanies: async (): Promise<Company[]> => {
    try {
      const response = await axiosClient.get(`/active-matches/companies`);
      return response.data;
    } catch (error) {
      console.error("❌ Error fetching companies:", error);
      throw error;
    }
  },
};
