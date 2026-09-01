import { defineStore } from "pinia";
import { api } from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "MASTER";
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    loading: false
  }),
  getters: {
    authenticated: (state) => Boolean(state.user),
    isMaster: (state) => state.user?.role === "MASTER"
  },
  actions: {
    async login(email: string, password: string) {
      const { data } = await api.post("/auth/login", { email, password });
      this.user = data.data.user;
      // Fallback CSRF untuk deploy BE & FE di domain berbeda.
      if (data.data.csrfToken) localStorage.setItem("csrf_token", data.data.csrfToken);
    },
    async loadMe() {
      this.loading = true;
      try {
        const { data } = await api.get("/auth/me");
        this.user = data.data;
      } catch {
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      await api.post("/auth/logout");
      localStorage.removeItem("csrf_token");
      this.user = null;
    }
  }
});
