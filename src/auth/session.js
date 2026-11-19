const TOKEN_KEY = "auth.token";
const USER_KEY = "auth.user";

export const getAuthToken = () => sessionStorage.getItem(TOKEN_KEY) || "";

export const getAuthUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  if (!token || !user) return;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const setAuthUser = (user) => {
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};
