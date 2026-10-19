// Nyimpen hasil permainan siswa ke database (Postgres via Neon).
// Dipanggil otomatis dari halaman tiap kali game selesai.

import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
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

  const { nama, kelas, skor, total } = req.body || {};
  if (!nama || typeof skor !== 'number' || typeof total !== 'number') {
    res.status(400).json({ error: 'Data tidak lengkap' });
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    res.status(500).json({ error: 'DATABASE_URL belum diset di Environment Variables Vercel' });
    return;
  }

  try {
    const sql = neon(dbUrl);

    await sql`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        nama TEXT NOT NULL,
        kelas TEXT,
        skor INTEGER NOT NULL,
        total_soal INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;

    await sql`
      INSERT INTO results (nama, kelas, skor, total_soal)
      VALUES (
        ${String(nama).slice(0, 60)},
        ${kelas ? String(kelas).slice(0, 30) : null},
        ${skor},
        ${total}
      )
    `;

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Gagal menyimpan ke database', detail: String(e) });
  }
}
