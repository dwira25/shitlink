<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Copy, Download } from "@lucide/vue";
import { fetchLinks, qrUrl } from "../services/linkService";
import type { ShortLink } from "../types";

const links = ref<ShortLink[]>([]);
const query = reactive({ page: 1, limit: 25, search: "", filter: "all" as const, sort: "newest" as const });

async function load() {
  const result = await fetchLinks(query);
  links.value = result.data;
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

onMounted(load);
</script>

<template>
  <section>
    <div>
      <h1 class="text-2xl font-semibold">QR Codes</h1>
      <p class="text-sm text-slate-500">Each QR code encodes the short URL, never the destination URL.</p>
    </div>
    <section class="panel mt-6 p-4">
      <input v-model="query.search" class="field" placeholder="Search QR by title, slug, or destination" @keyup.enter="load" />
    </section>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="link in links" :key="link.id" class="panel p-5">
        <div class="flex items-start gap-4">
          <img class="h-32 w-32 rounded-md border border-line bg-white p-2" :src="qrUrl(link.id, 'svg')" alt="QR preview" />
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold">{{ link.title }}</h2>
            <p class="mt-1 truncate text-sm text-slate-500">{{ link.shortUrl }}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <button class="btn btn-soft" @click="copy(link.shortUrl)"><Copy class="h-4 w-4" />Copy</button>
              <a class="btn btn-soft" :href="qrUrl(link.id, 'png')" download><Download class="h-4 w-4" />PNG</a>
              <a class="btn btn-soft" :href="qrUrl(link.id, 'svg', true)" download><Download class="h-4 w-4" />SVG</a>
            </div>
          </div>
        </div>
      </article>
      <p v-if="links.length === 0" class="text-sm text-slate-500">No QR codes found.</p>
    </div>
  </section>
</template>
