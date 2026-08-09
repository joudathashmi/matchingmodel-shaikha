export interface Opportunity {
  id: number;
  opportunity_name: string;
  sector: string;
  opportunity_description: string;
  investment_highlights: string;
  value_proposition: string;
  key_demand_drivers: string;
  key_players: string;
  materials_required: string;
  url: string;
}

export interface MatchingOutput {
  id: number;
  companyId: number;
  opportunityId: number;
  company_sector: string;
  opportunity_sector: string;
  sector_similarity: number;
  profile_similarity: number;
  product_similarity: number;
  ai_score: number;
  ai_decision: string;
  final_score: number;
  ai_explanation: string;
  rank: number;
  opportunity: Opportunity;
}

export interface CompanyDetails {
  id: number;
  company_name: string;
  company_sector: string;
  year_founded: number;
  company_profile: string;
  product_services: string;
  legal_structure: string;
  type_of_entity: string;
  status: string;
  control_structure: string;
  ultimate_parent_company: string;
  global_headquarters: string;
  number_of_employees: number;
  number_of_locations: number;
  fiscal_year_end_date: string;
  revenue_local_currency: number;
  currency: string;
  revenue_usd: number;
  presence_of_parent_company_in_mena: boolean;
  presence_of_company_in_mena: boolean;
  type_of_presence: string | null;
  mena_revenue_local_currency: number | null;
  ksa_revenue_local_currency: number | null;
  history_in_mena: string;
  presence_in_saudi: boolean;
  type_of_presence_saudi: string | null;
  companies_name_in_mena: string | null;
  companies_name_in_ksa: string | null;
  number_of_employees_parent: number | null;
  number_of_employees_ksa: number | null;
  number_of_employees_mena: number;
  mena_locations: string;
  mena_notes: string;
  rhq_status: string;
  rhq_license_status: string;
  rhq_country: string;
  rhq_city: string;
  rhq_country_coverage: string;
  rhq_entity_name: string;
  rhq_in_mena: boolean;
  rhq_number_of_employees: number;
  rhq_mandatory_activities: string;
  rhq_optional_activities: string;
  website_url: string | null;
  matching_outputs: MatchingOutput[];
  product_services_beautified: ProductServiceBeautified[];

}


interface ProductServiceBeautified {
  title: string;
  description: string;
}

export interface CompanyDetailsApiResponse {
  company: CompanyDetails;
}

// State interface
export interface CompanyDetailsState {
  data: CompanyDetails | null;
  loading: boolean;
  error: string | null;
  aiDecisionFilter: string;
}

// Action types
export const GET_COMPANY_DETAILS_REQUEST = 'GET_COMPANY_DETAILS_REQUEST';
export const GET_COMPANY_DETAILS_SUCCESS = 'GET_COMPANY_DETAILS_SUCCESS';
export const GET_COMPANY_DETAILS_FAILURE = 'GET_COMPANY_DETAILS_FAILURE';
export const SET_AI_DECISION_FILTER = 'SET_AI_DECISION_FILTER';
// Add this action type
export const CLEAR_COMPANY_DETAILS = 'CLEAR_COMPANY_DETAILS';
// Action interfaces
export interface GetCompanyDetailsRequestAction {
  type: typeof GET_COMPANY_DETAILS_REQUEST;
  payload: {
    companyId: number;
    aiDecision: string;
  };
}

export interface GetCompanyDetailsSuccessAction {
  type: typeof GET_COMPANY_DETAILS_SUCCESS;
  payload: CompanyDetails;
}

export interface GetCompanyDetailsFailureAction {
  type: typeof GET_COMPANY_DETAILS_FAILURE;
  payload: string;
}

export interface SetAiDecisionFilterAction {
  type: typeof SET_AI_DECISION_FILTER;
  payload: string;
}


// Add this action interface
export interface ClearCompanyDetailsAction {
  type: typeof CLEAR_COMPANY_DETAILS;
}

// Update the union type to include the new action
export type CompanyDetailsActionTypes = 
  | GetCompanyDetailsRequestAction
  | GetCompanyDetailsSuccessAction
  | GetCompanyDetailsFailureAction
  | SetAiDecisionFilterAction
  | ClearCompanyDetailsAction; // Add this