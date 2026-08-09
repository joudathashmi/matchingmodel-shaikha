import {
  CompanyStatsState,
  CompanyStatsActionTypes,
  GET_COMPANY_STATS_REQUEST,
  GET_COMPANY_STATS_SUCCESS,
  GET_COMPANY_STATS_FAILURE
} from '../types/getCompanyStatsTypes';

const initialState: CompanyStatsState = {
  data: null,
  loading: false,
  error: null
};

export const getCompanyStatsReducer = (
  state = initialState,
  action: CompanyStatsActionTypes
): CompanyStatsState => {
  switch (action.type) {
    case GET_COMPANY_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case GET_COMPANY_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null
      };
      
    case GET_COMPANY_STATS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: null
      };
      
    default:
      return state;
  }
};