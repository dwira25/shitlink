<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { X } from "@lucide/vue";
import type { LinkForm, ShortLink } from "../types";

const props = defineProps<{
  open: boolean;
  editing?: ShortLink | null;
  saving: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [payload: LinkForm];
}>();

const form = reactive<LinkForm>({
  title: "",
  destinationUrl: "",
  slug: "",
  description: "",
  expiresAt: "",
  status: "ACTIVE",
  ratingEnabled: false,
  minRatingEnabled: false,
  minRating: 3
});

const title = computed(() => (props.editing ? "Edit short link" : "Create short link"));

// Convert a UTC ISO string to the local "YYYY-MM-DDTHH:mm" value the
// datetime-local input expects (preserves the actual instant).
function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

watch(
  () => [props.open, props.editing] as const,
  () => {
    form.title = props.editing?.title || "";
    form.destinationUrl = props.editing?.destinationUrl || "";
    form.slug = props.editing?.slug || "";
    form.description = props.editing?.description || "";
    form.expiresAt = props.editing?.expiresAt ? toLocalDateTimeInput(props.editing.expiresAt) : "";
    form.status = props.editing?.status || "ACTIVE";
    form.ratingEnabled = props.editing?.ratingEnabled ?? false;
    form.minRatingEnabled = props.editing?.minRatingEnabled ?? false;
    form.minRating = props.editing?.minRating ?? 3;
  },
  { immediate: true }
);

function submit() {
  emit("submit", {
    ...form,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null
  });
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
    <form class="panel w-full max-w-2xl p-6" @submit.prevent="submit">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <button class="btn btn-soft h-10 w-10 p-0" type="button" aria-label="Close" @click="emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>
      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <label class="space-y-1">
          <span class="text-sm font-medium">Title</span>
          <input v-model="form.title" class="field" required />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium">Custom Slug</span>
          <input v-model="form.slug" class="field" placeholder="promo2026" />
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium">Destination URL</span>
          <input v-model="form.destinationUrl" class="field" type="url" required placeholder="https://example.com/product" />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium">Expiration Date</span>
          <input v-model="form.expiresAt" class="field" type="datetime-local" />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium">Status</span>
          <select v-model="form.status" class="field">
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <label class="space-y-1 md:col-span-2">
          <span class="text-sm font-medium">Description</span>
          <textarea v-model="form.description" class="field min-h-24" />
        </label>
        <div class="space-y-3 rounded-md border border-line p-4 md:col-span-2">
          <p class="text-sm font-medium">Rating settings</p>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.ratingEnabled" type="checkbox" />
            Enable rating page before redirect
          </label>
          <template v-if="form.ratingEnabled">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.minRatingEnabled" type="checkbox" />
              Require minimum rating to redirect
            </label>
            <label v-if="form.minRatingEnabled" class="block space-y-1">
              <span class="text-sm font-medium">Minimum Rating (1-5)</span>
              <select v-model.number="form.minRating" class="field">
                <option v-for="n in [1, 2, 3, 4, 5]" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
          </template>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button class="btn btn-soft" type="button" @click="emit('close')">Cancel</button>
        <button class="btn btn-primary" :disabled="saving" type="submit">{{ saving ? "Saving..." : "Save" }}</button>
      </div>
    </form>
  </div>
</template>
