<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from "chart.js";
import { Line } from "vue-chartjs";
import { computed } from "vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const props = defineProps<{
  rows: Array<{ date: string; clicks: number }>;
}>();

const data = computed(() => ({
  labels: props.rows.map((row) => row.date.slice(5)),
  datasets: [
    {
      label: "Clicks",
      data: props.rows.map((row) => row.clicks),
      borderColor: "#0f766e",
      backgroundColor: "rgba(15, 118, 110, 0.14)",
      fill: true,
      tension: 0.35
    }
  ]
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { precision: 0 } }
  }
};
</script>

<template>
  <div class="h-72">
    <Line :data="data" :options="options" />
  </div>
</template>
