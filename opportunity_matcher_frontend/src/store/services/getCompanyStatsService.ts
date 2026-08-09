import axiosClient from '../../api/axiosClient';
import { CompanyStats } from '../types/getCompanyStatsTypes';

// Use the same interface since API returns CompanyStats directly
interface GetCompanyStatsResponse extends CompanyStats {}

export const getCompanyStatsService = {
  getCompanyStats: async (): Promise<CompanyStats> => {
    try {
      const response = await axiosClient.get<GetCompanyStatsResponse>(
        '/companies/stats'
      );
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch company stats';
      throw new Error(errorMessage);
    }
  }
};

export default getCompanyStatsService;