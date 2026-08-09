import { RootState } from '../rootReducer';

export const selectOpportunityDetails = (state: RootState) => 
  state.opportunityDetails.data;

export const selectOpportunityDetailsLoading = (state: RootState) => 
  state.opportunityDetails.loading;

export const selectOpportunityDetailsError = (state: RootState) => 
  state.opportunityDetails.error;

export const selectMatchingOutputs = (state: RootState) => 
  state.opportunityDetails.data?.matching_outputs || [];