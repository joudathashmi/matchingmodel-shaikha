// src/store/actions/discoveryOpportunitiesActions.ts

import {
  GET_DISCOVERY_OPPORTUNITIES,
  GET_DISCOVERY_OPPORTUNITIES_SUCCESS,
  GET_DISCOVERY_OPPORTUNITIES_FAILURE,
  DiscoveryOpportunitiesRequest,
  DiscoveryOpportunitiesResponse,
  DiscoveryOpportunitiesActionTypes,
} from "../types/discoverOpportunitiesTypes";

/* ===== Action Creators ===== */
export const getDiscoveryOpportunities = (
  payload: DiscoveryOpportunitiesRequest
): DiscoveryOpportunitiesActionTypes => ({
  type: GET_DISCOVERY_OPPORTUNITIES,
  payload,
});

export const getDiscoveryOpportunitiesSuccess = (
  payload: DiscoveryOpportunitiesResponse
): DiscoveryOpportunitiesActionTypes => ({
  type: GET_DISCOVERY_OPPORTUNITIES_SUCCESS,
  payload,
});

export const getDiscoveryOpportunitiesFailure = (
  payload: string
): DiscoveryOpportunitiesActionTypes => ({
  type: GET_DISCOVERY_OPPORTUNITIES_FAILURE,
  payload,
});
