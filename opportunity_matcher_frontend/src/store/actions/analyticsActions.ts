import {
  GET_ANALYTICS,
  GET_ANALYTICS_SUCCESS,
  GET_ANALYTICS_FAILURE,
  AnalyticsState,
} from "../types/analyticsTypes";

type AnalyticsPayload = Omit<AnalyticsState, "loading" | "error">;

export const getAnalytics = () => ({
  type: GET_ANALYTICS,
});

export const getAnalyticsSuccess = (payload: AnalyticsPayload) => ({
  type: GET_ANALYTICS_SUCCESS,
  payload,
});

export const getAnalyticsFailure = (payload: string) => ({
  type: GET_ANALYTICS_FAILURE,
  payload,
});
