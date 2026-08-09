import {
  GET_EXECUTIVE_OVERVIEW_REQUEST,
  GET_EXECUTIVE_OVERVIEW_SUCCESS,
  GET_EXECUTIVE_OVERVIEW_FAILURE,
} from "../types/getExecutiveOverviewAiTypes";

export const getExecutiveOverviewRequest = () => ({
  type: GET_EXECUTIVE_OVERVIEW_REQUEST,
});

export const getExecutiveOverviewSuccess = (data: any) => ({
  type: GET_EXECUTIVE_OVERVIEW_SUCCESS,
  payload: data,
});

export const getExecutiveOverviewFailure = (error: string) => ({
  type: GET_EXECUTIVE_OVERVIEW_FAILURE,
  payload: error,
});