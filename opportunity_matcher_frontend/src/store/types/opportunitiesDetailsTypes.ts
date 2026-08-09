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
  company: {
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
    revenue_local_currency: number | null;
    currency: string;
    revenue_usd: number;
    presence_of_parent_company_in_mena: boolean;
    presence_of_company_in_mena: boolean;
    type_of_presence: string;
    mena_revenue_local_currency: number | null;
    ksa_revenue_local_currency: number | null;
    history_in_mena: string | null;
    presence_in_saudi: boolean;
    type_of_presence_saudi: string;
    companies_name_in_mena: string;
    companies_name_in_ksa: string;
    number_of_employees_parent: number | null;
    number_of_employees_ksa: number;
    number_of_employees_mena: number;
    mena_locations: string;
    mena_notes: string;
    rhq_status: string;
    rhq_license_status: string;
    rhq_country: string | null;
    rhq_city: string | null;
    rhq_country_coverage: string | null;
    rhq_entity_name: string | null;
    rhq_in_mena: boolean;
    rhq_number_of_employees: number | null;
    rhq_mandatory_activities: string | null;
    rhq_optional_activities: string | null;
    website_url: string | null;
  };
}

export interface OpportunityDetails {
  id: number;
  opportunity_name: string;
  sector: string;
  opportunity_description: string;
  investment_highlights: string;
  key_players: string;
  materials_required: string;
  url: string;
  matching_outputs: MatchingOutput[];
  investment_range:string;
  jobs_created:string;
  key_demand_drivers: string;
  gdp_impact:string;
  investment_appeal:string;
  economic_impact:string;
  market_readiness:string;
  value_proposition:string;


}

export interface OpportunityDetailsResponse {
  opportunity: OpportunityDetails;
}

export const GET_OPPORTUNITY_DETAILS_REQUEST = 'GET_OPPORTUNITY_DETAILS_REQUEST';
export const GET_OPPORTUNITY_DETAILS_SUCCESS = 'GET_OPPORTUNITY_DETAILS_SUCCESS';
export const GET_OPPORTUNITY_DETAILS_FAILURE = 'GET_OPPORTUNITY_DETAILS_FAILURE';

export interface GetOpportunityDetailsRequestAction {
  type: typeof GET_OPPORTUNITY_DETAILS_REQUEST;
  payload: {
    opportunityId: number;
    aiDecision?: string;
  };
}

export interface GetOpportunityDetailsSuccessAction {
  type: typeof GET_OPPORTUNITY_DETAILS_SUCCESS;
  payload: OpportunityDetailsResponse;
}

export interface GetOpportunityDetailsFailureAction {
  type: typeof GET_OPPORTUNITY_DETAILS_FAILURE;
  payload: string;
}

export type OpportunityDetailsActionTypes =
  | GetOpportunityDetailsRequestAction
  | GetOpportunityDetailsSuccessAction
  | GetOpportunityDetailsFailureAction;

export interface OpportunityDetailsState {
  loading: boolean;
  data: OpportunityDetails | null;
  error: string | null;
}