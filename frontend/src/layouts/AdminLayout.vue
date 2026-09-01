<script setup lang="ts">
import { BarChart3, LayoutDashboard, Link as LinkIcon, LogOut, QrCode, Settings, User, Users } from "@lucide/vue";
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();

const items = computed(() => [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/links", label: "Links", icon: LinkIcon },
  { to: "/admin/qr-codes", label: "QR Codes", icon: QrCode },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/profile", label: "Profile", icon: User },
  ...(auth.isMaster ? [{ to: "/admin/users", label: "Master User", icon: Users }] : [])
]);

async function logout() {
  await auth.logout();
  await router.push("/login");
}
</script>

<template>
  <div class="min-h-screen lg:flex">
    <aside class="border-b border-line bg-white lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div class="flex h-16 items-center px-5">
        <div>
          <p class="text-lg font-semibold">Shortlink Admin</p>
          <p class="text-xs text-slate-500">Dynamic QR manager</p>
        </div>
      </div>
      <nav class="flex gap-1 overflow-x-auto px-3 pb-3 lg:block lg:space-y-1 lg:overflow-visible">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-cloud hover:text-ink"
          active-class="bg-teal-50 text-brand"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
        <button class="flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-cloud hover:text-ink" @click="logout">
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </nav>
    </aside>
    <main class="min-h-screen p-4 lg:ml-64 lg:p-8">
      <RouterView />
    </main>
  </div>
</template>
