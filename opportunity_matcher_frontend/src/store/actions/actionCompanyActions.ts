import {
  GET_COMPANIES,
  GET_COMPANIES_SUCCESS,
  GET_COMPANIES_FAILURE,
  Company,
} from "../types/actionCompanyTypes";

export const getCompanies = () => ({
  type: GET_COMPANIES as typeof GET_COMPANIES,
});

export const getCompaniesSuccess = (payload: Company[]) => ({
  type: GET_COMPANIES_SUCCESS as typeof GET_COMPANIES_SUCCESS,
  payload,
});

export const getCompaniesFailure = (payload: string) => ({
  type: GET_COMPANIES_FAILURE as typeof GET_COMPANIES_FAILURE,
  payload,
});

export type CompaniesActionTypes =
  | ReturnType<typeof getCompanies>
  | ReturnType<typeof getCompaniesSuccess>
  | ReturnType<typeof getCompaniesFailure>;
