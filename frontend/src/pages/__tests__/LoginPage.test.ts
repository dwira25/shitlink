import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../LoginPage.vue";

const push = vi.fn();
const loginMock = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({ push })
}));

vi.mock("../../stores/auth", () => ({
  useAuthStore: () => ({ login: loginMock })
}));

describe("LoginPage", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    push.mockReset();
    loginMock.mockReset();
  });

  it("renders the login form", () => {
    const wrapper = mount(LoginPage);
    expect(wrapper.find("h1").text()).toContain("Admin Login");
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it("submits credentials and navigates to /admin", async () => {
    loginMock.mockResolvedValue(undefined);
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="email"]').setValue("admin@example.com");
    await wrapper.find('input[type="password"]').setValue("ChangeMe123!");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    expect(loginMock).toHaveBeenCalledWith("admin@example.com", "ChangeMe123!");
    expect(push).toHaveBeenCalledWith("/admin");
  });

  it("shows an error when login fails", async () => {
    loginMock.mockRejectedValue(new Error("nope"));
    const wrapper = mount(LoginPage);
    await wrapper.find('input[type="email"]').setValue("admin@example.com");
    await wrapper.find('input[type="password"]').setValue("wrong");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();
    expect(wrapper.text()).toContain("Login failed");
    expect(push).not.toHaveBeenCalled();
  });
});
