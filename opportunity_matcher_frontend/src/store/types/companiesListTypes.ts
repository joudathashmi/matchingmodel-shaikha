// Company object returned by API
export interface CompaniesList {
  id: number;
  company_name: string;
  company_sector: string;
  product_services:string;
  year_founded: number;
  global_headquarters: string;
  number_of_employees: number;
  revenue_local_currency: number;
  currency: string;
  revenue_usd: number;
  number_of_employees_parent: number | null;
  website_url:string;
}

// Filters in Redux and API should match
export interface CompaniesListFilters {
  page?: number;
  limit?: number;
  sectors?: string[]; // ✅ match API field "sectors"
  company_size?: { min: number; max: number }; // ✅ match API field "company_size"
  revenue?: { min: number; max: number };
  presence_of_company_in_mena?: boolean;
  presence_in_saudi?: boolean;
  rhq_status?: boolean | string; // API sends "true"/"false" string, so keep both
  search?: string;
}

// Request payload for API (extends filters + pagination)
export interface CompaniesListRequest extends CompaniesListFilters {
  page: number;
  limit: number;
}

// Response from API
export interface CompaniesListResponse {
  data: CompaniesList[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: CompaniesListFilters;
  };
}

// Redux state
export interface CompaniesListState {
  companiesList: CompaniesList[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: CompaniesListFilters;
}

// Action Types
export const GET_COMPANIES_LIST = 'GET_COMPANIES_LIST';
export const GET_COMPANIES_LIST_SUCCESS = 'GET_COMPANIES_LIST_SUCCESS';
export const GET_COMPANIES_LIST_FAILURE = 'GET_COMPANIES_LIST_FAILURE';
export const SET_COMPANIES_LIST_FILTERS = 'SET_COMPANIES_LIST_FILTERS';

// Action Interfaces
interface GetCompaniesListAction {
  type: typeof GET_COMPANIES_LIST;
  payload: CompaniesListRequest;
}

interface GetCompaniesListSuccessAction {
  type: typeof GET_COMPANIES_LIST_SUCCESS;
  payload: CompaniesListResponse;
}

interface GetCompaniesListFailureAction {
  type: typeof GET_COMPANIES_LIST_FAILURE;
  payload: string;
}

interface SetCompaniesListFiltersAction {
  type: typeof SET_COMPANIES_LIST_FILTERS;
  payload: CompaniesListFilters;
}

export type CompaniesListActionTypes =
  | GetCompaniesListAction
  | GetCompaniesListSuccessAction
  | GetCompaniesListFailureAction
  | SetCompaniesListFiltersAction;
