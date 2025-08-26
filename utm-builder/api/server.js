import express from 'express';
import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config(); // .env im Projektroot

const sql = neon(process.env.DATABASE_URL);

const app = express();
app.use(express.json());

app.get('/api/licenses', async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    const result = await sql`
      SELECT category, name, tags, utm_writing
      FROM licenses
      WHERE (category ILIKE ${`%${searchTerm}%`} OR name ILIKE ${`%${searchTerm}%`} OR tags ILIKE ${`%${searchTerm}%`})
      GROUP BY category, name, tags, utm_writing
      ORDER BY category, name;
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    const licensesByCategory = rows.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push({ name: row.name, tags: row.tags, utm_writing: row.utm_writing });
      return acc;
    }, {});
    res.json(licensesByCategory);
  } catch (error) {
    console.error('DB-Fehler:', error.message);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}/api/licenses`);
});