<template>
  <div class="min-h-screen bg-gradient-to-b from-slate-50 to-white">
    <!-- Navigation -->
    <nav class="border-b border-slate-200 bg-white">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span class="text-xl font-bold text-slate-900">ShortLink</span>
          </div>
          <div class="flex items-center space-x-4">
            <a href="/login" class="text-slate-700 hover:text-indigo-600 font-medium">Masuk</a>
            <a href="/admin" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">Dashboard</a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <header class="container mx-auto px-4 py-16 md:py-24">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
          Buat Short Link <span class="text-indigo-600">Cepat</span> dan <span class="text-indigo-600">Analitik Lengkap</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Platform short link dengan rating, QR code, dan analitik real-time. Gratis untuk digunakan.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/admin" class="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg">
            Mulai Sekarang
          </a>
          <a href="#features" class="border border-slate-300 text-slate-700 px-8 py-3 rounded-lg hover:bg-slate-50 font-semibold text-lg">
            Fitur
          </a>
        </div>
      </div>
    </header>

    <!-- Features -->
    <section id="features" class="container mx-auto px-4 py-16">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">Fitur Unggulan</h2>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Rating System</h3>
            <p class="text-slate-600">Tambahkan rating page sebelum redirect. Filter kualitas traffic dengan minimum rating.</p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Analitik Lengkap</h3>
            <p class="text-slate-600">Track clicks, lokasi, device, dan browser. Dashboard real-time dengan chart interaktif.</p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">QR Code Generator</h3>
            <p class="text-slate-600">Generate QR code otomatis untuk setiap link. Download dalam format SVG atau PNG.</p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Bulk Management</h3>
            <p class="text-slate-600">Kelompokkan, aktifkan/nonaktifkan, atau hapus link dalam jumlah banyak sekaligus.</p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Keamanan</h3>
            <p class="text-slate-600">CSRF protection, rate limiting, dan validasi input. Multi-user dengan role management.</p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div class="h-12 w-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <svg class="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-2">Vercel Ready</h3>
            <p class="text-slate-600">Deploy dengan satu klik ke Vercel. Serverless functions dan edge network global.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-indigo-50 py-16">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Siap Meningkatkan Engagement?</h2>
        <p class="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
          Mulai gunakan ShortLink sekarang. Gratis untuk tim kecil, scalable untuk kebutuhan enterprise.
        </p>
        <a href="/admin" class="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-semibold text-lg">
          Buat Akun Gratis
        </a>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200 py-8">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <div class="flex items-center space-x-2">
              <div class="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span class="text-lg font-bold text-slate-900">ShortLink</span>
            </div>
            <p class="text-slate-600 mt-2">© 2026 ShortLink. All rights reserved.</p>
          </div>
          <div class="flex space-x-6">
            <a href="/login" class="text-slate-600 hover:text-indigo-600">Masuk</a>
            <a href="/admin" class="text-slate-600 hover:text-indigo-600">Dashboard</a>
            <a href="https://github.com" class="text-slate-600 hover:text-indigo-600">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Landing page tidak memerlukan logic khusus
</script>

<style scoped>
/* Additional custom styles if needed */
</style>