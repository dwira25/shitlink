<script setup lang="ts">
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold">Profile</h1>
    <section class="panel mt-6 p-5">
      <dl class="grid gap-4 text-sm md:grid-cols-2">
        <div>
          <dt class="text-slate-500">Name</dt>
          <dd class="mt-1 font-medium">{{ auth.user?.name }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Email</dt>
          <dd class="mt-1 font-medium">{{ auth.user?.email }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Role</dt>
          <dd class="mt-1 font-medium">{{ auth.user?.role }}</dd>
        </div>
      </dl>
    </section>
  </section>
</template>
