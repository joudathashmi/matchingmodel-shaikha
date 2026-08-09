import { combineReducers } from "redux";

import authReducer from "./reducers/authReducer";
import companiesListReducer from "./reducers/companiesListReducer";
import getCompanyDetailsReducer from "./reducers/getCompanyDetailsReducer";
import { getCompanyStatsReducer } from "./reducers/getCompanyStatsReducer";
import authLogoutReducer from "./reducers/authLogoutReducer";
import sectorCountsReducer from "./reducers/sectorCountsReducer";
import { topOpportunitiesReducer } from "./reducers/topOpportunitiesReducer";
import { actionSectorReducer } from "./reducers/actionSectorReducer";
import { actionCompanyReducer } from "./reducers/actionCompanyReducer";
import { activeMatchesReducer } from "./reducers/filterMatchesReducer";
import { discoverSectorCountReducer } from "./reducers/discoverSectorCountReducer";
import { discoveryOpportunitiesReducer } from "./reducers/discoverOpportunitiesReducer";
import { opportunitiesSectorReducer } from "./reducers/opportunitiesSectorReducer";
import opportunitiesReducer from "./reducers/getOpportunitiesListReducer"; 
import getOpportunityDetailsReducer from "./reducers/OpportunityDetailsReducer";
import { searchReducer } from "./reducers/searchReducer";
import { executiveOverviewReducer } from "./reducers/getExecutiveOverviewAiReducer";
import { analyticsReducer } from "./reducers/analyticsReducer";
import bookmarkReducer from "./reducers/createBookmarkReducer";
import deleteBookmarkReducer from "./reducers/deleteBookmarkReducer";
import getAllBookmarksReducer from "./reducers/getAllBookmarksReducer";
import marketIntelligenceReducer from "./reducers/marketIntelligenceReducer";
import opportunityMarketIntelligenceReducer from "./reducers/opportunityMarketIntelligenceReducer";
import CreateMatchAgreementReducer from "./reducers/CreateMatchAgreementReducer";
import deleteMatchAgreementReducer from "./reducers/deleteMatchAgreementReducer";
import getMatchAgreementsReducer from "./reducers/getMatchAgreementsReducer";
import getUserRoleReducer from "./reducers/getUserRoleReducer";

export const rootReducer = combineReducers({

  auth: authReducer,
  companiesList: companiesListReducer,
  companyDetails: getCompanyDetailsReducer,
  companyStats: getCompanyStatsReducer,
  authLogout: authLogoutReducer,
  sectorCounts: sectorCountsReducer,
  topOpportunities: topOpportunitiesReducer,
  actionSector: actionSectorReducer,
  actionCompany: actionCompanyReducer,
  activeMatches: activeMatchesReducer,
  discoverSectorCount: discoverSectorCountReducer,
  discoveryOpportunities: discoveryOpportunitiesReducer,
  opportunitiesSector: opportunitiesSectorReducer,
  opportunities: opportunitiesReducer,
  opportunityDetails: getOpportunityDetailsReducer,
  search: searchReducer,
  executiveOverview: executiveOverviewReducer,
  analytics: analyticsReducer,
  bookmarks: bookmarkReducer,
  deleteBookmark: deleteBookmarkReducer,
  getAllBookmarks: getAllBookmarksReducer,
  marketIntelligence: marketIntelligenceReducer,
  opportunityMarketIntelligence: opportunityMarketIntelligenceReducer,
  matchAgreement: CreateMatchAgreementReducer,
  deleteMatchAgreement: deleteMatchAgreementReducer,
  getMatchAgreements: getMatchAgreementsReducer,
  userRole: getUserRoleReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;