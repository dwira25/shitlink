<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Pencil, Plus, ShieldCheck, ShieldOff, Trash2, X } from "@lucide/vue";
import { userService } from "../services/userService";
import { useAuthStore } from "../stores/auth";
import type { ManagedUser, UserForm } from "../types";

const auth = useAuthStore();
const items = ref<ManagedUser[]>([]);
const loading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const editing = ref<ManagedUser | null>(null);
const errorMessage = ref("");

const form = reactive<UserForm>({ name: "", email: "", password: "", role: "ADMIN" });

async function load() {
  loading.value = true;
  try {
    items.value = await userService.list();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = null;
  form.name = "";
  form.email = "";
  form.password = "";
  form.role = "ADMIN";
  errorMessage.value = "";
  modalOpen.value = true;
}

function openEdit(user: ManagedUser) {
  editing.value = user;
  form.name = user.name;
  form.email = user.email;
  form.password = "";
  form.role = user.role;
  errorMessage.value = "";
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
}

async function submit() {
  saving.value = true;
  errorMessage.value = "";
  try {
    if (editing.value) {
      const payload: Partial<UserForm> = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      await userService.update(editing.value.id, payload);
    } else {
      await userService.create(form);
    }
    modalOpen.value = false;
    await load();
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.error || "Failed to save user";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(user: ManagedUser) {
  if (user.isActive) {
    await userService.deactivate(user.id);
  } else {
    await userService.activate(user.id);
  }
  await load();
}

async function remove(user: ManagedUser) {
  if (!confirm(`Delete user ${user.email}?`)) return;
  await userService.remove(user.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Master User</h1>
        <p class="text-sm text-slate-500">Kelola seluruh user admin dari Master Data User. Tidak ada user statis.</p>
      </div>
      <button class="btn btn-primary" @click="openCreate">
        <Plus class="h-4 w-4" />
        Tambah User
      </button>
    </div>

    <div class="panel overflow-x-auto p-0">
      <table class="w-full text-sm">
        <thead class="bg-cloud text-left text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">Nama</th>
            <th class="px-4 py-3">Email</th>
            <th class="px-4 py-3">Role</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in items" :key="user.id" class="border-t border-line">
            <td class="px-4 py-3 font-medium">{{ user.name }}</td>
            <td class="px-4 py-3">{{ user.email }}</td>
            <td class="px-4 py-3">{{ user.role }}</td>
            <td class="px-4 py-3">
              <span :class="user.isActive ? 'text-emerald-600' : 'text-rose-600'">
                {{ user.isActive ? "Aktif" : "Nonaktif" }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <button class="btn btn-soft h-9 w-9 p-0" title="Edit" @click="openEdit(user)">
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  v-if="auth.user?.id !== user.id"
                  class="btn btn-soft h-9 w-9 p-0"
                  :title="user.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                  @click="toggleActive(user)"
                >
                  <ShieldOff v-if="user.isActive" class="h-4 w-4" />
                  <ShieldCheck v-else class="h-4 w-4" />
                </button>
                <button
                  v-if="auth.user?.id !== user.id"
                  class="btn btn-soft h-9 w-9 p-0 text-rose-600"
                  title="Hapus"
                  @click="remove(user)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && !items.length">
            <td class="px-4 py-6 text-center text-slate-500" colspan="5">Belum ada user.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <form class="panel w-full max-w-md p-6" @submit.prevent="submit">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">{{ editing ? "Edit User" : "Tambah User" }}</h2>
          <button class="btn btn-soft h-10 w-10 p-0" type="button" aria-label="Close" @click="closeModal">
            <X class="h-4 w-4" />
          </button>
        </div>
        <p v-if="errorMessage" class="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{{ errorMessage }}</p>
        <div class="mt-6 space-y-4">
          <label class="block space-y-1">
            <span class="text-sm font-medium">Nama</span>
            <input v-model="form.name" class="field" required />
          </label>
          <label class="block space-y-1">
            <span class="text-sm font-medium">Email</span>
            <input v-model="form.email" class="field" type="email" required />
          </label>
          <label class="block space-y-1">
            <span class="text-sm font-medium">{{ editing ? "Password baru (opsional)" : "Password" }}</span>
            <input v-model="form.password" class="field" type="password" :required="!editing" minlength="8" />
          </label>
          <label class="block space-y-1">
            <span class="text-sm font-medium">Role</span>
            <select v-model="form.role" class="field">
              <option value="ADMIN">Admin</option>
              <option value="MASTER">Master</option>
            </select>
          </label>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button class="btn btn-soft" type="button" @click="closeModal">Batal</button>
          <button class="btn btn-primary" :disabled="saving" type="submit">{{ saving ? "Menyimpan..." : "Simpan" }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
