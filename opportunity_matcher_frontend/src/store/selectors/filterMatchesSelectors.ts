// filterMatchesSelectors.ts

import { RootState } from '../../store';
import { ActiveMatchesState } from '../types/filterMatchesTypes';

export const selectActiveMatchesState = (state: RootState): ActiveMatchesState =>
  state.activeMatches;

export const selectActiveMatchesData = (state: RootState) =>
  state.activeMatches.activeMatches;

export const selectActiveMatchesLoading = (state: RootState) =>
  state.activeMatches.loading;

export const selectActiveMatchesError = (state: RootState) =>
  state.activeMatches.error;

export const selectActiveMatchesMeta = (state: RootState) =>
  state.activeMatches.meta;
