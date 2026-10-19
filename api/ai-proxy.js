// Proxy aman buat manggil Gemini API dari halaman Tajwid Challenge.
// API key disimpan di Environment Variable Vercel (GEMINI_API_KEY),
// TIDAK PERNAH ditaruh di kode halaman/HTML — jadi aman dari dicuri orang.

export default async function handler(req, res) {
  // Izinkan halaman manapun manggil endpoint ini (bisa dipersempit nanti kalau mau)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing "prompt" in request body' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY belum diset di Environment Variables Vercel' });
    return;
  }

  // Model gratis (free tier) Gemini. Kalau suatu saat mau ganti model,
  // cek nama persisnya di dropdown AI Studio / halaman pricing Gemini.
  const MODEL_ID = 'gemini-3.8-flash';
  const MAX_RETRIES = 2; // total percobaan = 1 awal + 2 ulang = 3x

  async function callGeminiOnce() {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    const data = await r.json();
    return { ok: r.ok, status: r.status, data };
  }

  try {
    let lastDetail = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const { ok, status, data } = await callGeminiOnce();

      if (ok) {
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        res.status(200).json({ text });
        return;
      }

      lastDetail = data;

      // Cuma retry kalau errornya memang sifatnya sementara:
      // 503 = server Gemini lagi sibuk, 429 = kena rate limit sesaat.
      // Error lain (misal API key salah / model salah) langsung berhenti, tidak usah diulang.
      const isTransient = status === 503 || status === 429;
      if (isTransient && attempt < MAX_RETRIES) {
        const delayMs = 700 * (attempt + 1); // 700ms, lalu 1400ms
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      break;
    }

    res.status(502).json({ error: 'Gemini API error', detail: lastDetail });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menghubungi Gemini API' });
  }
}
