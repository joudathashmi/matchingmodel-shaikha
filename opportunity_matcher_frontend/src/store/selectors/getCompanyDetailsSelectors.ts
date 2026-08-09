import { RootState } from '../rootReducer';
import { CompanyDetailsState } from '../types/getCompanyDetailsTypes';

export const selectCompanyDetails = (state: RootState): CompanyDetailsState['data'] => 
  state.companyDetails.data;

export const selectCompanyDetailsLoading = (state: RootState): boolean => 
  state.companyDetails.loading;

export const selectCompanyDetailsError = (state: RootState): string | null => 
  state.companyDetails.error;

export const selectAiDecisionFilter = (state: RootState): string => 
  state.companyDetails.aiDecisionFilter;

export const selectFilteredMatchingOutputs = (state: RootState) => {
  const companyDetails = state.companyDetails.data;
  const aiFilter = state.companyDetails.aiDecisionFilter;
  
  if (!companyDetails || !companyDetails.matching_outputs) return [];
  
  if (aiFilter === 'All') return companyDetails.matching_outputs;
  
  return companyDetails.matching_outputs.filter(
    output => output.ai_decision === aiFilter
  );
};