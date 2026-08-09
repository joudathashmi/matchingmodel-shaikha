import {
  MatchAgreementState,
  MatchAgreementActionTypes,
  CREATE_MATCH_AGREEMENT_REQUEST,
  CREATE_MATCH_AGREEMENT_SUCCESS,
  CREATE_MATCH_AGREEMENT_FAILURE,
  RESET_MATCH_AGREEMENT_STATE,
} from "../types/CreateMatchAgreementTypes";

const initialState: MatchAgreementState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const matchAgreementReducer = (
  state = initialState,
  action: MatchAgreementActionTypes
): MatchAgreementState => {
  switch (action.type) {
    case CREATE_MATCH_AGREEMENT_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };

    case CREATE_MATCH_AGREEMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        data: action.payload,
      };

    case CREATE_MATCH_AGREEMENT_FAILURE:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
        data: null,
      };

    case RESET_MATCH_AGREEMENT_STATE:
      return initialState;

    default:
      return state;
  }
};

export default matchAgreementReducer;