import { RootState } from '../../store';
import { TopOpportunitiesState } from '../types/topOpportunitiesTypes';

export const selectTopOpportunitiesState = (state: RootState): TopOpportunitiesState =>
  state.topOpportunities;

export const selectTopOpportunitiesData = (state: RootState) =>
  state.topOpportunities.topOpportunities;

export const selectTopOpportunitiesLoading = (state: RootState) =>
  state.topOpportunities.loading;

export const selectTopOpportunitiesError = (state: RootState) =>
  state.topOpportunities.error;

export const selectTopOpportunitiesMeta = (state: RootState) =>
  state.topOpportunities.meta;
