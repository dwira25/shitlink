import { api } from "./api";
import type { ApiEnvelope, ManagedUser, UserForm } from "../types";

export const userService = {
  async list() {
    const { data } = await api.get<ApiEnvelope<ManagedUser[]>>("/users");
    return data.data;
  },
  async create(payload: UserForm) {
    const { data } = await api.post<ApiEnvelope<ManagedUser>>("/users", payload);
    return data.data;
  },
  async update(id: number, payload: Partial<UserForm>) {
    const { data } = await api.put<ApiEnvelope<ManagedUser>>(`/users/${id}`, payload);
    return data.data;
  },
  async activate(id: number) {
    const { data } = await api.post<ApiEnvelope<ManagedUser>>(`/users/${id}/activate`);
    return data.data;
  },
  async deactivate(id: number) {
    const { data } = await api.post<ApiEnvelope<ManagedUser>>(`/users/${id}/deactivate`);
    return data.data;
  },
  async remove(id: number) {
    await api.delete(`/users/${id}`);
  }
};
