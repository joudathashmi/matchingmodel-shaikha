import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import rootReducer from "./rootReducer";

import { authSaga } from "./sagas/authSaga";
import { companiesListSaga } from "./sagas/companiesListSaga";
import { watchGetCompanyDetails } from "./sagas/getCompanyDetailsSaga";
import { watchGetCompanyStats } from "./sagas/getCompanyStatsSaga";
import { authLogoutSaga } from "./sagas/authLogoutSaga";

import { watchGetSectorCounts } from "./sagas/sectorCountsSaga";
import { topOpportunitiesSaga } from "./sagas/topOpportunitiesSaga";
import { watchSectorCounts } from "./sagas/actionSectorSaga";
import { watchCompanies } from "./sagas/actionCompanySaga";
import { activeMatchesSaga } from "./sagas/filterMatchesSaga";
import { discoverSectorCountSaga } from "./sagas/discoverSectorCountSaga";
import { discoveryOpportunitiesSaga } from "./sagas/discoverOpportunitiesSaga";
import { watchOpportunitiesSectorCounts } from "./sagas/opportunitiesSectorSaga";
import { watchGetOpportunitiesList } from "./sagas/getOpportunitiesListSaga"; 
import { watchGetOpportunityDetails } from "./sagas/OpportunityDetailsSaga";
import { watchSearchSaga } from "./sagas/searchSaga";
import { watchGetExecutiveOverview } from "./sagas/getExecutiveOverviewAiSaga";
import { watchAnalytics } from "./sagas/analyticsSaga";
import { watchCreateBookmark } from "./sagas/createBookmarkSaga";
import { watchDeleteBookmark } from "./sagas/deleteBookmarkSaga";
import { watchGetMarketIntelligence } from "./sagas/marketIntelligenceSaga";
import { watchGetOpportunityMI } from "./sagas/opportunityMarketIntelligenceSaga";
import { watchGetAllBookmarks } from "./sagas/getAllBookmarksSaga";
import { watchCreateMatchAgreement } from "./sagas/CreateMatchAgreementSaga";
import { watchDeleteMatchAgreement } from "./sagas/deleteMatchAgreementSaga";
import { watchGetMatchAgreements } from "./sagas/getMatchAgreementsSaga";
import { watchGetUserRole } from "./sagas/getUserRoleSaga";
// Create the saga middleware
const sagaMiddleware = createSagaMiddleware();

// Configure the store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

// Run individual sagas directly (NO ROOT SAGA)

sagaMiddleware.run(authSaga);
sagaMiddleware.run(companiesListSaga);
sagaMiddleware.run(watchGetCompanyDetails); ;
sagaMiddleware.run(watchGetCompanyStats);
sagaMiddleware.run(authLogoutSaga);
sagaMiddleware.run(watchGetSectorCounts);
sagaMiddleware.run(topOpportunitiesSaga);
sagaMiddleware.run(watchSectorCounts); 
sagaMiddleware.run(watchCompanies);
sagaMiddleware.run(activeMatchesSaga);
sagaMiddleware.run(discoverSectorCountSaga); 
sagaMiddleware.run(discoveryOpportunitiesSaga);
sagaMiddleware.run(watchOpportunitiesSectorCounts);
sagaMiddleware.run(watchGetOpportunitiesList);
sagaMiddleware.run(watchGetOpportunityDetails);
sagaMiddleware.run(watchSearchSaga);
sagaMiddleware.run(watchGetExecutiveOverview);
sagaMiddleware.run(watchAnalytics)
sagaMiddleware.run(watchCreateBookmark);
sagaMiddleware.run(watchDeleteBookmark);
sagaMiddleware.run(watchGetAllBookmarks);
sagaMiddleware.run(watchGetMarketIntelligence);
sagaMiddleware.run(watchGetOpportunityMI);
sagaMiddleware.run(watchCreateMatchAgreement);
sagaMiddleware.run(watchDeleteMatchAgreement);
sagaMiddleware.run(watchGetMatchAgreements);
sagaMiddleware.run(watchGetUserRole);
// Export RootState and AppDispatch types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;