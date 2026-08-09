import axiosClient from '../../api/axiosClient';
import { CompanyDetailsApiResponse } from '../types/getCompanyDetailsTypes';

export const companyService = {
  getCompanyDetails: async (companyId: number, aiDecision?: string): Promise<CompanyDetailsApiResponse> => {
    // Build base URL
    let url = `/companies/${companyId}`;
    
    // Only add ai_decision parameter if it's provided
    if (aiDecision !== undefined && aiDecision !== null) {
      url += `?ai_decision=${aiDecision}`;
    }
    
    const response = await axiosClient.get(url);
    return response.data;
  },
};