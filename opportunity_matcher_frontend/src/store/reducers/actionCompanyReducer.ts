import {
  GET_COMPANIES,
  GET_COMPANIES_SUCCESS,
  GET_COMPANIES_FAILURE,
  CompaniesState,
} from "../types/actionCompanyTypes";
import { CompaniesActionTypes } from "../actions/actionCompanyActions";

const initialState: CompaniesState = {
  companies: [],
  loading: false,
  error: null,
};

export const actionCompanyReducer = (
  state = initialState,
  action: CompaniesActionTypes
): CompaniesState => {
  switch (action.type) {
    case GET_COMPANIES:
      return { ...state, loading: true, error: null };
    case GET_COMPANIES_SUCCESS:
      return { ...state, loading: false, companies: action.payload };
    case GET_COMPANIES_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
