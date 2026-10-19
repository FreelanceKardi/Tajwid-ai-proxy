# Tajwid AI Proxy

Fungsi kecil ini meneruskan permintaan dari halaman "Nun Sukun & Tanwin" ke Gemini API,
tanpa pernah menaruh API key di kode halaman (supaya tidak dicuri orang).

## Langkah deploy (tanpa command line, lewat web browser saja)

1. Buat API key Gemini (gratis, tanpa kartu kredit):
   - Buka https://aistudio.google.com
   - Login pakai akun Google
   - Klik "Get API key" di menu kiri, buat key baru
   - Catat nama model Flash/Flash-Lite yang tersedia di situ (akan dipakai di langkah 4)
   - Simpan API key-nya, jangan dibagikan ke siapa pun

2. Buat repo GitHub baru (gratis):
   - Buka https://github.com, login/daftar
   - Klik "New repository", kasih nama bebas (misal `tajwid-ai-proxy`)
   - Upload folder ini (ai-proxy.js, package.json, README.md) lewat tombol
     "Add file" -> "Upload files" di halaman repo (drag & drop juga bisa)

3. Deploy ke Vercel (gratis):
   - Buka https://vercel.com, daftar/login pakai akun GitHub
   - Klik "Add New" -> "Project", pilih repo yang baru dibuat tadi
   - Sebelum klik Deploy, buka bagian "Environment Variables":
     - Name: `GEMINI_API_KEY`
     - Value: (tempel API key dari langkah 1)
   - Klik Deploy, tunggu beberapa menit
   - Setelah selesai, Vercel kasih URL seperti `https://tajwid-ai-proxy.vercel.app`

4. Edit file `api/ai-proxy.js`:
   - Ganti `MODEL_ID_DI_SINI` dengan nama model persis dari AI Studio (langkah 1)
   - Upload ulang file yang sudah diedit ke GitHub, Vercel otomatis deploy ulang

5. Kabari URL Vercel-nya (contoh: `https://tajwid-ai-proxy.vercel.app`) supaya
   halaman Nun Sukun/Tanwin bisa disambungkan ke proxy ini.
