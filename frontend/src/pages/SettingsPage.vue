<template>
  <section>
    <h1 class="text-2xl font-semibold">Settings</h1>
    <section class="panel mt-6 p-5">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="space-y-1">
          <span class="text-sm font-medium">Public Base URL</span>
          <input class="field" value="Configured on backend PUBLIC_BASE_URL" disabled />
        </label>
        <label class="space-y-1">
          <span class="text-sm font-medium">Redirect Code</span>
          <input class="field" value="302 Found" disabled />
        </label>
      </div>
    </section>
  </section>
</template>
