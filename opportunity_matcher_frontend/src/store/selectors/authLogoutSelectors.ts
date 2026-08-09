import { RootState } from '../rootReducer';

export const selectLogoutState = (state: RootState) => state.authLogout;
export const selectLogoutLoading = (state: RootState) => state.authLogout.loading;
export const selectLogoutError = (state: RootState) => state.authLogout.error;
export const selectLogoutMessage = (state: RootState) => state.authLogout.message;