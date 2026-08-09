import axiosClient from "../../api/axiosClient";
import { CompaniesListRequest, CompaniesListResponse } from '../types/companiesListTypes';
import { AxiosError } from 'axios';

export const companiesListService = {
  getCompaniesList: async (request: CompaniesListRequest): Promise<CompaniesListResponse> => {
    try {
      console.log('🔍 Making request to /companies with data:', request);
      
      const response = await axiosClient.post(`/companies`, request);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching companies list:', error);
      throw error; // Re-throw to let the caller handle it
    }
  },
};