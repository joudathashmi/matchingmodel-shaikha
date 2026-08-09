import {
  DeleteMatchAgreementState,
  DeleteMatchAgreementActionTypes,
  DELETE_MATCH_AGREEMENT_REQUEST,
  DELETE_MATCH_AGREEMENT_SUCCESS,
  DELETE_MATCH_AGREEMENT_FAILURE,
  DELETE_MATCH_AGREEMENT_RESET,
} from "../types/deleteMatchAgreementTypes";

const initialState: DeleteMatchAgreementState = {
  loading: false,
  success: false,
  error: null,
};

const deleteMatchAgreementReducer = (
  state = initialState,
  action: DeleteMatchAgreementActionTypes
): DeleteMatchAgreementState => {
  switch (action.type) {
    case DELETE_MATCH_AGREEMENT_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };
    case DELETE_MATCH_AGREEMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
      };
    case DELETE_MATCH_AGREEMENT_FAILURE:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };
    case DELETE_MATCH_AGREEMENT_RESET:
      return initialState;
    default:
      return state;
  }
};

export default deleteMatchAgreementReducer;