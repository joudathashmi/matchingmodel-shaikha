import {
  CompaniesListState,
  CompaniesListActionTypes,
  GET_COMPANIES_LIST,
  GET_COMPANIES_LIST_SUCCESS,
  GET_COMPANIES_LIST_FAILURE,
  SET_COMPANIES_LIST_FILTERS
} from '../types/companiesListTypes';

const initialState: CompaniesListState = {
  companiesList: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  filters: {},
};

const companiesListReducer = (state = initialState, action: CompaniesListActionTypes): CompaniesListState => {
  switch (action.type) {
    case GET_COMPANIES_LIST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case GET_COMPANIES_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        companiesList: action.payload.data,
        total: action.payload.meta.total,
        page: action.payload.meta.page,
        limit: action.payload.meta.limit,
        totalPages: action.payload.meta.totalPages,
        filters: {
          ...state.filters,
          ...(action.payload.meta.filters || {}),
        },
      };

    case GET_COMPANIES_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SET_COMPANIES_LIST_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

export default companiesListReducer;