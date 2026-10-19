// Proxy aman buat manggil Gemini API dari halaman Nun Sukun/Tanwin.
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

  // GANTI "MODEL_ID_DI_SINI" sesuai nama model yang dipilih di aistudio.google.com
  // (contoh umum: "gemini-flash-latest" atau nama versi Flash yang tersedia saat setup).
  // Cek nama persisnya di dropdown model AI Studio sebelum deploy.
  const MODEL_ID = '3.1 Pro';

  try {
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
    if (!r.ok) {
      res.status(502).json({ error: 'Gemini API error', detail: data });
      return;
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menghubungi Gemini API' });
  }
}
