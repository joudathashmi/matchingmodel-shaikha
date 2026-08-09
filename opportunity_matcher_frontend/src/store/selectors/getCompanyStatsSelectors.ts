import { RootState } from '../rootReducer';

export const selectCompanyStats = (state: RootState) => state.companyStats.data;
export const selectCompanyStatsLoading = (state: RootState) => state.companyStats.loading;
export const selectCompanyStatsError = (state: RootState) => state.companyStats.error;

// Additional specific selectors if needed
export const selectTotalCompanies = (state: RootState) => state.companyStats.data?.totalCompanies ?? 0;
export const selectMeenaPresence = (state: RootState) => state.companyStats.data?.meenaPresence ?? 0;
export const selectSaudiActive = (state: RootState) => state.companyStats.data?.saudiActive ?? 0;
export const selectRhqEntities = (state: RootState) => state.companyStats.data?.rhqEntities ?? 0;
export const selectAverageRevenue = (state: RootState) => state.companyStats.data?.averageRevenue ?? 0;