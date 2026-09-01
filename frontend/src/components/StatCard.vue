<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
}>();
</script>

<template>
  <div class="panel p-5">
    <p class="text-sm text-slate-500">{{ label }}</p>
    <p class="mt-2 text-3xl font-semibold text-ink">{{ value }}</p>
  </div>
</template>
