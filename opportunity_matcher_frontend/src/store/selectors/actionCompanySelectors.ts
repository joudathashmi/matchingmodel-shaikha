import { RootState } from "../../store";
import { Company } from "../types/actionCompanyTypes";

export const selectCompaniesState = (state: RootState) => state.actionCompany;

export const selectCompanies = (state: RootState): Company[] =>
  state.actionCompany.companies;

export const selectCompaniesLoading = (state: RootState): boolean =>
  state.actionCompany.loading;

export const selectCompaniesError = (state: RootState): string | null =>
  state.actionCompany.error;
