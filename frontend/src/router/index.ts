import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AdminLayout from "../layouts/AdminLayout.vue";
import LandingPage from "../pages/LandingPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import LinksPage from "../pages/LinksPage.vue";
import QrCodesPage from "../pages/QrCodesPage.vue";
import AnalyticsPage from "../pages/AnalyticsPage.vue";
import SettingsPage from "../pages/SettingsPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";
import UsersPage from "../pages/UsersPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: LandingPage },
    { path: "/login", component: LoginPage },
    {
      path: "/admin",
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: "", component: DashboardPage },
        { path: "links", component: LinksPage },
        { path: "qr-codes", component: QrCodesPage },
        { path: "analytics", component: AnalyticsPage },
        { path: "settings", component: SettingsPage },
        { path: "profile", component: ProfilePage },
        { path: "users", component: UsersPage, meta: { requiresMaster: true } }
      ]
    }
  ]
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.user && !auth.loading) {
    await auth.loadMe();
  }
  if (to.meta.requiresAuth && !auth.authenticated) {
    return "/login";
  }
  if (to.meta.requiresMaster && !auth.isMaster) {
    return "/admin";
  }
  if (to.path === "/login" && auth.authenticated) {
    return "/admin";
  }
});
