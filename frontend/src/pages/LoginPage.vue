<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { LogIn } from "@lucide/vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const auth = useAuthStore();
const email = ref("admin@example.com");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function submit() {
  error.value = "";
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    await router.push("/admin");
  } catch {
    error.value = "Login failed. Check your email and password.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-cloud p-4">
    <form class="panel w-full max-w-md p-8" @submit.prevent="submit">
      <h1 class="text-2xl font-semibold">Admin Login</h1>
      <div class="mt-6 space-y-4">
        <label class="space-y-1">
          <span class="text-sm font-medium">Email</span>
          <input v-model="email" class="field" type="email" autocomplete="email" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium">Password</span>
          <input v-model="password" class="field" type="password" autocomplete="current-password" required />
        </label>
      </div>
      <p v-if="error" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</p>
      <button class="btn btn-primary mt-6 w-full" :disabled="loading" type="submit">
        <LogIn class="h-4 w-4" />
        {{ loading ? "Signing in..." : "Login" }}
      </button>
    </form>
  </main>
</template>
