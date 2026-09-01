<script setup lang="ts">
import type { Breakdown } from "../types";

defineProps<{
  title: string;
  rows: Breakdown[];
}>();
</script>

<template>
  <section class="panel p-5">
    <h2 class="text-base font-semibold">{{ title }}</h2>
    <div class="mt-4 space-y-3">
      <div v-for="row in rows" :key="row.label">
        <div class="flex items-center justify-between text-sm">
          <span>{{ row.label }}</span>
          <span class="font-medium">{{ row.value.toLocaleString() }}</span>
        </div>
        <div class="mt-1 h-2 rounded-full bg-slate-100">
          <div class="h-2 rounded-full bg-accent" :style="{ width: `${Math.min(100, row.value)}%` }" />
        </div>
      </div>
      <p v-if="rows.length === 0" class="text-sm text-slate-500">No data yet.</p>
    </div>
  </section>
</template>
