import { createApi, fetchBaseQuery, type BaseQueryFn } from "@reduxjs/toolkit/query/react";

export const getToken = () =>
  typeof document === "undefined"
    ? undefined
    : document.cookie.match(/(?:^|; )token=([^;]*)/)?.[1];

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${decodeURIComponent(token)}`);
    headers.set("Accept", "application/json");
    return headers;
  }
});

const baseQueryWithAutoLogout: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (
    result.error?.status === 401 &&
    typeof window !== "undefined" &&
    !window.location.pathname.includes("/login")
  ) {
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/dashboard/login";
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAutoLogout,
  tagTypes: ["Report", "Contacts", "Contact", "Orders", "Order", "Users", "Audit"],
  endpoints: () => ({})
});
