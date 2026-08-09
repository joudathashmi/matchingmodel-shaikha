import { RootState } from '../rootReducer';

export const selectCompaniesList = (state: RootState) => state.companiesList.companiesList;
export const selectCompaniesListLoading = (state: RootState) => state.companiesList.loading;
export const selectCompaniesListError = (state: RootState) => state.companiesList.error;
export const selectCompaniesListTotal = (state: RootState) => state.companiesList.total;
export const selectCompaniesListPage = (state: RootState) => state.companiesList.page;
export const selectCompaniesListLimit = (state: RootState) => state.companiesList.limit;
export const selectCompaniesListTotalPages = (state: RootState) => state.companiesList.totalPages;
export const selectCompaniesListFilters = (state: RootState) => state.companiesList.filters;