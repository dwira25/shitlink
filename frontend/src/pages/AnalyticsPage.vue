<script setup lang="ts">
import { onMounted, ref } from "vue";
import BreakdownList from "../components/BreakdownList.vue";
import LineChart from "../components/LineChart.vue";
import StatCard from "../components/StatCard.vue";
import { fetchAnalytics } from "../services/analyticsService";
import type { AnalyticsSummary } from "../types";

const analytics = ref<AnalyticsSummary | null>(null);

onMounted(async () => {
  analytics.value = await fetchAnalytics();
});
</script>

<template>
  <section>
    <div>
      <h1 class="text-2xl font-semibold">Analytics</h1>
      <p class="text-sm text-slate-500">Click trends, unique clicks, and client breakdowns.</p>
    </div>
    <div v-if="analytics" class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Total Clicks" :value="analytics.totalClicks.toLocaleString()" />
      <StatCard label="Unique Clicks" :value="analytics.uniqueClicks.toLocaleString()" />
      <StatCard label="Today" :value="analytics.clicksToday.toLocaleString()" />
      <StatCard label="This Week" :value="analytics.clicksThisWeek.toLocaleString()" />
      <StatCard label="This Month" :value="analytics.clicksThisMonth.toLocaleString()" />
    </div>
    <section v-if="analytics" class="panel mt-6 p-5">
      <h2 class="text-base font-semibold">Clicks per day</h2>
      <LineChart class="mt-4" :rows="analytics.clicksPerDay" />
    </section>
    <div v-if="analytics" class="mt-6 grid gap-6 xl:grid-cols-3">
      <BreakdownList title="Device Breakdown" :rows="analytics.deviceBreakdown" />
      <BreakdownList title="Browser Breakdown" :rows="analytics.browserBreakdown" />
      <BreakdownList title="OS Breakdown" :rows="analytics.osBreakdown" />
    </div>
  </section>
</template>
