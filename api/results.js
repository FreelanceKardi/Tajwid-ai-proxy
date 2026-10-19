// Halaman rekap hasil siswa buat Pak Sukardi. Dilindungi kata sandi
// sederhana (TEACHER_KEY) biar ga sembarang orang bisa lihat nama + skor.
// Akses: https://domain-kamu.vercel.app/api/results?key=KATASANDI
// Export CSV: https://domain-kamu.vercel.app/api/results?key=KATASANDI&format=csv

import { neon } from '@neondatabase/serverless';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const teacherKey = process.env.TEACHER_KEY;
  if (!teacherKey) {
    res.status(500).send('TEACHER_KEY belum diset di Environment Variables Vercel');
    return;
  }

  const providedKey = req.query?.key;
  if (providedKey !== teacherKey) {
    res.status(401).send('Kata sandi salah atau belum diisi. Tambahkan ?key=KATASANDI_KAMU di akhir URL.');
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    res.status(500).send('DATABASE_URL belum diset di Environment Variables Vercel');
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

    const rows = await sql`
      SELECT nama, kelas, skor, total_soal, created_at
      FROM results
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    const isCsv = req.query?.format === 'csv';

    if (isCsv) {
      const header = 'Nama,Kelas,Skor,Total Soal,Waktu\n';
      const body = rows
        .map((r) => {
          const waktu = new Date(r.created_at).toLocaleString('id-ID');
          const nama = String(r.nama).replace(/"/g, '""');
          const kelas = r.kelas ? String(r.kelas).replace(/"/g, '""') : '';
          return `"${nama}","${kelas}",${r.skor},${r.total_soal},"${waktu}"`;
        })
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="rekap-tajwid-challenge.csv"');
      res.status(200).send(header + body);
      return;
    }

    const tableRows = rows
      .map((r) => {
        const waktu = new Date(r.created_at).toLocaleString('id-ID');
        return `<tr>
          <td>${escapeHtml(r.nama)}</td>
          <td>${escapeHtml(r.kelas || '-')}</td>
          <td><b>${r.skor}</b></td>
          <td>${r.total_soal}</td>
          <td>${escapeHtml(waktu)}</td>
        </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Rekap Tajwid Challenge</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --ink:#f1f5f9; --muted:#94a3b8; --line:#334155; --primary:#38bdf8; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: 'Segoe UI', Arial, sans-serif; background: var(--bg); color: var(--ink); padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  p.sub { color: var(--muted); margin: 0 0 20px; font-size: 14px; }
  .btn { display:inline-block; background: var(--primary); color:#0f172a; font-weight:700; text-decoration:none; padding:10px 18px; border-radius:10px; margin-bottom:20px; }
  table { width:100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; }
  th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--line); font-size: 14px; }
  th { background: #0b1220; color: var(--muted); text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
  tr:last-child td { border-bottom: none; }
  .empty { color: var(--muted); padding: 20px; text-align:center; }
</style>
</head>
<body>
  <h1>📊 Rekap Hasil Tajwid Challenge</h1>
  <p class="sub">Total ${rows.length} data terbaru (maks 1000) &middot; diurutkan dari yang terbaru</p>
  <a class="btn" href="?key=${encodeURIComponent(providedKey)}&format=csv">⬇️ Unduh sebagai CSV</a>
  <table>
    <thead>
      <tr><th>Nama</th><th>Kelas</th><th>Skor</th><th>Total Soal</th><th>Waktu</th></tr>
    </thead>
    <tbody>
      ${rows.length ? tableRows : '<tr><td colspan="5" class="empty">Belum ada data. Suruh murid main dulu ya!</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    res.status(500).send('Gagal mengambil data dari database: ' + String(e));
  }
}
