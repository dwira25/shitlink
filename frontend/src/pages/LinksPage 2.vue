<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Copy, Edit, Plus, QrCode, Trash2 } from "@lucide/vue";
import LinkFormModal from "../components/LinkFormModal.vue";
import { bulkLinks, createLink, deleteLink, fetchLinks, qrUrl, updateLink } from "../services/linkService";
import type { LinkForm, ShortLink } from "../types";

const links = ref<ShortLink[]>([]);
const selected = ref<number[]>([]);
const meta = reactive({ page: 1, limit: 25, total: 0, pages: 1 });
const query = reactive({
  page: 1,
  limit: 25,
  search: "",
  filter: "all" as const,
  sort: "newest" as const
});
const modalOpen = ref(false);
const editing = ref<ShortLink | null>(null);
const saving = ref(false);
const created = ref<ShortLink | null>(null);

const allSelected = computed(() => links.value.length > 0 && links.value.every((link) => selected.value.includes(link.id)));

async function load() {
  const result = await fetchLinks(query);
  links.value = result.data;
  meta.page = result.meta?.page || 1;
  meta.limit = result.meta?.limit || query.limit;
  meta.total = result.meta?.total || 0;
  meta.pages = result.meta?.pages || 1;
  selected.value = [];
}

function openCreate() {
  created.value = null;
  editing.value = null;
  modalOpen.value = true;
}

function openEdit(link: ShortLink) {
  created.value = null;
  editing.value = link;
  modalOpen.value = true;
}

async function save(payload: LinkForm) {
  saving.value = true;
  try {
    created.value = editing.value ? await updateLink(editing.value.id, payload) : await createLink(payload);
    modalOpen.value = false;
    await load();
  } finally {
    saving.value = false;
  }
}

async function remove(link: ShortLink) {
  if (!confirm(`Delete "${link.title}"?`)) return;
  await deleteLink(link.id);
  await load();
}

async function bulk(action: "activate" | "deactivate" | "delete") {
  if (selected.value.length === 0) return;
  if (action === "delete" && !confirm(`Delete ${selected.value.length} selected links?`)) return;
  await bulkLinks(action, selected.value);
  await load();
}

function toggleAll() {
  selected.value = allSelected.value ? [] : links.value.map((link) => link.id);
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}

onMounted(load);
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">Links</h1>
        <p class="text-sm text-slate-500">Create, edit, deactivate, delete, and track many short links.</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <Plus class="h-4 w-4" />
        Create Short Link
      </button>
    </div>

    <section v-if="created" class="panel mt-6 p-5">
      <p class="text-sm font-medium">Short URL</p>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <code class="rounded-md bg-cloud px-3 py-2 text-sm">{{ created.shortUrl }}</code>
        <button class="btn btn-soft" @click="copy(created.shortUrl)"><Copy class="h-4 w-4" />Copy</button>
        <a class="btn btn-soft" :href="qrUrl(created.id, 'png')" download>Download PNG</a>
        <a class="btn btn-soft" :href="qrUrl(created.id, 'svg', true)" download>Download SVG</a>
      </div>
      <img class="mt-4 h-36 w-36 rounded-md border border-line bg-white p-2" :src="qrUrl(created.id, 'svg')" alt="QR code" />
    </section>

    <section class="panel mt-6 p-4">
      <div class="grid gap-3 md:grid-cols-[1fr_150px_170px_120px]">
        <input v-model="query.search" class="field" placeholder="Search title, slug, or destination" @keyup.enter="load" />
        <select v-model="query.filter" class="field" @change="load">
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
        <select v-model="query.sort" class="field" @change="load">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="most_clicks">Most clicks</option>
          <option value="least_clicks">Least clicks</option>
          <option value="recently_updated">Recently updated</option>
        </select>
        <select v-model.number="query.limit" class="field" @change="load">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <button class="btn btn-soft" :disabled="selected.length === 0" @click="bulk('activate')">Bulk Activate</button>
        <button class="btn btn-soft" :disabled="selected.length === 0" @click="bulk('deactivate')">Bulk Deactivate</button>
        <button class="btn btn-danger" :disabled="selected.length === 0" @click="bulk('delete')">Bulk Delete</button>
      </div>
    </section>

    <section class="panel mt-6 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-line text-left text-sm">
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3"><input type="checkbox" :checked="allSelected" @change="toggleAll" /></th>
              <th class="px-4 py-3">Title</th>
              <th class="px-4 py-3">Short URL</th>
              <th class="px-4 py-3">Destination</th>
              <th class="px-4 py-3">Clicks</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Created</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line bg-white">
            <tr v-for="link in links" :key="link.id">
              <td class="px-4 py-3"><input v-model="selected" :value="link.id" type="checkbox" /></td>
              <td class="max-w-56 truncate px-4 py-3 font-medium">{{ link.title }}</td>
              <td class="max-w-64 truncate px-4 py-3">{{ link.shortUrl }}</td>
              <td class="max-w-72 truncate px-4 py-3 text-slate-600">{{ link.destinationUrl }}</td>
              <td class="px-4 py-3">{{ (link.clickCount || 0).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-1 text-xs font-medium" :class="link.status === 'ACTIVE' && !link.expired ? 'bg-teal-50 text-brand' : 'bg-slate-100 text-slate-600'">
                  {{ link.expired ? "Expired" : link.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-slate-600">{{ new Date(link.createdAt).toLocaleDateString() }}</td>
              <td class="px-4 py-3">
                <div class="flex gap-1">
                  <button class="btn btn-soft h-9 w-9 p-0" title="Copy" @click="copy(link.shortUrl)"><Copy class="h-4 w-4" /></button>
                  <a class="btn btn-soft h-9 w-9 p-0" title="QR" :href="qrUrl(link.id, 'svg')" target="_blank"><QrCode class="h-4 w-4" /></a>
                  <button class="btn btn-soft h-9 w-9 p-0" title="Edit" @click="openEdit(link)"><Edit class="h-4 w-4" /></button>
                  <button class="btn btn-soft h-9 w-9 p-0 text-red-600" title="Delete" @click="remove(link)"><Trash2 class="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
            <tr v-if="links.length === 0">
              <td class="px-4 py-8 text-center text-slate-500" colspan="8">No links found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
        <span>Page {{ meta.page }} of {{ meta.pages }} · {{ meta.total.toLocaleString() }} records</span>
        <div class="flex gap-2">
          <button class="btn btn-soft" :disabled="query.page <= 1" @click="query.page--; load()">Previous</button>
          <button class="btn btn-soft" :disabled="query.page >= meta.pages" @click="query.page++; load()">Next</button>
        </div>
      </div>
    </section>

    <LinkFormModal :open="modalOpen" :editing="editing" :saving="saving" @close="modalOpen = false" @submit="save" />
  </section>
</template>
