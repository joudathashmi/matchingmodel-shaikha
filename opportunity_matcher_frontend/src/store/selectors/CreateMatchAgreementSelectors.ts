import { RootState } from "../rootReducer";

export const selectMatchAgreement = (state: RootState) => state.matchAgreement;

export const selectMatchAgreementLoading = (state: RootState) => 
  state.matchAgreement.loading;

export const selectMatchAgreementSuccess = (state: RootState) => 
  state.matchAgreement.success;

export const selectMatchAgreementError = (state: RootState) => 
  state.matchAgreement.error;

export const selectMatchAgreementData = (state: RootState) => 
  state.matchAgreement.data;