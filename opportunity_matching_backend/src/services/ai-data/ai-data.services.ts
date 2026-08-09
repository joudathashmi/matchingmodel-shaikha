// src\services\ai-data\ai-data.services.ts
import * as executiveOverviewService from "./ai-data-executive.service";
import * as analyticsService from "./ai-data-analytics.service";
import * as companyService from "./ai-data-company.service";
import * as opportunityService from "./ai-data-opportunity.service";

export async function getPageAIData(page: string) {
  switch (page) {
    case "executiveOverview":
      return executiveOverviewService.getPageAIDataForExecutiveOverview();
    case "analytics":
      return analyticsService.getPageAIDataForAnalytics();
    case "company":
      return companyService.getPageAIDataForCompany();
    case "opportunity":
      return opportunityService.getPageAIDataForOpportunity();
    default:
      throw new Error("Invalid page. Allowed value: 'executiveOverview' or 'analytics' or 'company' or 'opportunity'");
  }
}