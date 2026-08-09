import { RootState } from "../../store";
import { DiscoveryOpportunitiesState } from "../types/discoverOpportunitiesTypes";

export const selectDiscoveryOpportunitiesState = (
  state: RootState
): DiscoveryOpportunitiesState => state.discoveryOpportunities;

export const selectDiscoveryOpportunitiesData = (state: RootState) =>
  state.discoveryOpportunities.opportunities;

export const selectDiscoveryOpportunitiesLoading = (state: RootState) =>
  state.discoveryOpportunities.loading;

export const selectDiscoveryOpportunitiesError = (state: RootState) =>
  state.discoveryOpportunities.error;

export const selectDiscoveryOpportunitiesMeta = (state: RootState) =>
  state.discoveryOpportunities.meta;
