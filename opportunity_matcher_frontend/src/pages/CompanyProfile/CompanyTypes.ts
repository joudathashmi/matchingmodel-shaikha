export interface CompanyGridTypes {
  company: string;
  sector: string;
  product: string;
  yearFounded: number;
  website: string;
  country: string;
  employees: number;
  revenue: string;
}

export interface CompanyTableTypes{
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
  ksa_revenue_local_currency: number;
  history_in_mena: string | null;
  presence_in_saudi: boolean;
  type_of_presence_saudi: string;
  companies_name_in_mena: string | null;
  companies_name_in_ksa: string;
  number_of_employees_parent: number | null;
  number_of_employees_ksa: number | null;
  number_of_employees_mena: number | null;
  mena_locations: string | null;
  mena_notes: string | null;
  rhq_status: string;
  rhq_license_status: string;
  rhq_country: string;
  rhq_city: string;
  rhq_country_coverage: string;
  rhq_entity_name: string | null;
  rhq_in_mena: boolean;
  rhq_number_of_employees: number | null;
  rhq_mandatory_activities: string | null;
  rhq_optional_activities: string | null;
  matching_outputs: any[];
 
}