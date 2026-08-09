import {
  OpportunityDetailsState,
  OpportunityDetailsActionTypes,
  GET_OPPORTUNITY_DETAILS_REQUEST,
  GET_OPPORTUNITY_DETAILS_SUCCESS,
  GET_OPPORTUNITY_DETAILS_FAILURE
} from '../types/opportunitiesDetailsTypes';

const initialState: OpportunityDetailsState = {
  loading: false,
  data: null,
  error: null
};

const getOpportunityDetailsReducer = (
  state = initialState,
  action: OpportunityDetailsActionTypes
): OpportunityDetailsState => {
  switch (action.type) {
    case GET_OPPORTUNITY_DETAILS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case GET_OPPORTUNITY_DETAILS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload.opportunity,
        error: null
      };
    case GET_OPPORTUNITY_DETAILS_FAILURE:
      return {
        ...state,
        loading: false,
        data: null,
        error: action.payload
      };
    default:
      return state;
  }
};

export default getOpportunityDetailsReducer;