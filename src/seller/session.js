import { clearAuthSession, getAuthToken } from "../auth/session";

export const getSellerToken = () => getAuthToken();

export const setSellerToken = (token) => {
  if (token) {
    sessionStorage.setItem("auth.token", token);
  } else {
    clearAuthSession();
  }
};
