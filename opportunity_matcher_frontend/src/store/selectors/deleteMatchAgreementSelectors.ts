import { RootState } from "../index";

export const selectDeleteMatchAgreementLoading = (state: RootState) =>
  state.deleteMatchAgreement.loading;

export const selectDeleteMatchAgreementSuccess = (state: RootState) =>
  state.deleteMatchAgreement.success;

export const selectDeleteMatchAgreementError = (state: RootState) =>
  state.deleteMatchAgreement.error;

export const selectDeleteMatchAgreementState = (state: RootState) =>
  state.deleteMatchAgreement;