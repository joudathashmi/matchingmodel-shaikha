// src/store/selectors/getMatchAgreementsSelectors.ts
import { RootState } from "../rootReducer";
import { MatchAgreement } from "../types/getMatchAgreementsTypes";

// Safe selectors that handle undefined state
export const selectMatchAgreements = (state: RootState) => 
  state.getMatchAgreements?.data || [];

export const selectMatchAgreementsLoading = (state: RootState) => 
  state.getMatchAgreements?.loading || false;

export const selectMatchAgreementsError = (state: RootState) => 
  state.getMatchAgreements?.error || null;

export const selectMatchAgreementsByStatus = (status: string) => (state: RootState) =>
  (state.getMatchAgreements?.data || []).filter((agreement: MatchAgreement) => agreement.status === status);