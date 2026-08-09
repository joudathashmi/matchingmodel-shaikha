import {
  CompanyDetailsState,
  CompanyDetailsActionTypes,
  GET_COMPANY_DETAILS_REQUEST,
  GET_COMPANY_DETAILS_SUCCESS,
  GET_COMPANY_DETAILS_FAILURE,
  SET_AI_DECISION_FILTER,
  CLEAR_COMPANY_DETAILS // Add this import
} from '../types/getCompanyDetailsTypes';

const initialState: CompanyDetailsState = {
  data: null,
  loading: false,
  error: null,
  aiDecisionFilter: 'Yes'
};

const getCompanyDetailsReducer = (
  state = initialState,
  action: CompanyDetailsActionTypes
): CompanyDetailsState => {
  switch (action.type) {
    case GET_COMPANY_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case GET_COMPANY_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null
      };
      
    case GET_COMPANY_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: null
      };
      
    case SET_AI_DECISION_FILTER:
      return {
        ...state,
        aiDecisionFilter: action.payload
      };
      
    // Add this case for clearing company details
    case CLEAR_COMPANY_DETAILS:
      return {
        ...initialState
      };
      
    default:
      return state;
  }
};

export default getCompanyDetailsReducer;