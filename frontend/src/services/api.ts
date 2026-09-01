import axios from "axios";

function readCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

// FE & BE terpisah (Vercel): set VITE_API_URL=https://<backend-domain>/api.
// Lokal tetap pakai "/api" lewat proxy Vite.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  // Cross-domain: cookie csrf_token milik domain BE, tidak terbaca via document.cookie.
  // Simpan token dari body response login ke localStorage sebagai fallback.
  const csrf = localStorage.getItem("csrf_token") ?? readCookie("csrf_token");
  if (csrf) {
    config.headers.set("x-csrf-token", decodeURIComponent(csrf));
  }
  return config;
});
