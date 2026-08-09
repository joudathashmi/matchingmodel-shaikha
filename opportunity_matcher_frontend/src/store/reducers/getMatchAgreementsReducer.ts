import {
  GetMatchAgreementsState,
  GetMatchAgreementsActionTypes,
  GET_MATCH_AGREEMENTS_REQUEST,
  GET_MATCH_AGREEMENTS_SUCCESS,
  GET_MATCH_AGREEMENTS_FAILURE,
} from "../types/getMatchAgreementsTypes";

const initialState: GetMatchAgreementsState = {
  data: [],
  loading: false,
  error: null,
};

const getMatchAgreementsReducer = (
  state = initialState,
  action: GetMatchAgreementsActionTypes
): GetMatchAgreementsState => {
  switch (action.type) {
    case GET_MATCH_AGREEMENTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case GET_MATCH_AGREEMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      };
    case GET_MATCH_AGREEMENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: [],
      };
    default:
      return state;
  }
};

export default getMatchAgreementsReducer;