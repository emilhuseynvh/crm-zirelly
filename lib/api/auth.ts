import { api } from "./base";
import type { User } from "./types";

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<
      { token: string; expires_in: number; user: User },
      { email: string; password: string }
    >({
      query: (body) => ({ url: "crm/auth/login", method: "POST", body })
    }),
    logout: build.mutation<{ message: string }, void>({
      query: () => ({ url: "crm/auth/logout", method: "POST" })
    }),
    me: build.query<{ data: User }, void>({
      query: () => "crm/auth/me"
    })
  })
});

export const { useLoginMutation, useLogoutMutation, useMeQuery } = authApi;
