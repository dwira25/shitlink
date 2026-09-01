<script setup lang="ts">
import { onMounted, ref } from "vue";
import LineChart from "../components/LineChart.vue";
import StatCard from "../components/StatCard.vue";
import { fetchDashboard } from "../services/analyticsService";
import type { DashboardSummary } from "../types";

const dashboard = ref<DashboardSummary | null>(null);

onMounted(async () => {
  dashboard.value = await fetchDashboard();
});
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <p class="text-sm text-slate-500">Overview of links, QR codes, and clicks.</p>
      </div>
    </div>
    <div v-if="dashboard" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Links" :value="dashboard.totalLinks.toLocaleString()" />
      <StatCard label="Total Clicks" :value="dashboard.totalClicks.toLocaleString()" />
      <StatCard label="Active Links" :value="dashboard.activeLinks.toLocaleString()" />
      <StatCard label="Inactive Links" :value="dashboard.inactiveLinks.toLocaleString()" />
      <StatCard label="QR Codes" :value="dashboard.qrCodes.toLocaleString()" />
    </div>
    <div v-if="dashboard" class="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
      <section class="panel p-5">
        <h2 class="text-base font-semibold">Clicks per day</h2>
        <LineChart class="mt-4" :rows="dashboard.clicksPerDay" />
      </section>
      <section class="panel p-5">
        <h2 class="text-base font-semibold">Top 10 Links</h2>
        <div class="mt-4 space-y-3">
          <div v-for="link in dashboard.topLinks" :key="link.id" class="flex items-center justify-between gap-3 text-sm">
            <span class="truncate">{{ link.title }}</span>
            <span class="font-medium">{{ link.clicks.toLocaleString() }}</span>
          </div>
          <p v-if="dashboard.topLinks.length === 0" class="text-sm text-slate-500">No clicks yet.</p>
        </div>
      </section>
    </div>
    <div v-if="dashboard" class="mt-6 grid gap-6 xl:grid-cols-2">
      <section class="panel p-5">
        <h2 class="text-base font-semibold">Recent Links</h2>
        <div class="mt-4 divide-y divide-line">
          <div v-for="link in dashboard.recentLinks" :key="link.id" class="flex items-center justify-between gap-4 py-3 text-sm">
            <span class="truncate">{{ link.title }}</span>
            <span class="text-slate-500">{{ link.clicks.toLocaleString() }} clicks</span>
          </div>
        </div>
      </section>
      <section class="panel p-5">
        <h2 class="text-base font-semibold">Recent Clicks</h2>
        <div class="mt-4 divide-y divide-line">
          <div v-for="click in dashboard.recentClicks" :key="click.id" class="flex items-center justify-between gap-4 py-3 text-sm">
            <span class="truncate">{{ click.link.title }}</span>
            <span class="text-slate-500">{{ new Date(click.clickedAt).toLocaleString() }}</span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>
