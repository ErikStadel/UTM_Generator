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
      SELECT id, category, name, tags, utm_writing
      FROM licenses
      WHERE (category ILIKE ${`%${searchTerm}%`} OR name ILIKE ${`%${searchTerm}%`} OR tags ILIKE ${`%${searchTerm}%`})
      GROUP BY id, category, name, tags, utm_writing
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

app.post('/api/licenses', async (req, res) => {
  try {
    const { category, tags, name, utm_writing } = req.body;
    console.log('POST-Daten:', { category, tags, name, utm_writing }); // Debug-Log
    if (!category || !name || !utm_writing) {
      return res.status(400).json({ error: 'Kategorie, Name und UTM-Schreibweise erforderlich' });
    }
    const result = await sql`
      INSERT INTO licenses (category, tags, name, utm_writing)
      VALUES (${category}, ${tags}, ${name}, ${utm_writing})
      RETURNING *;
    `;
    console.log('INSERT-Ergebnis:', result); // Debug-Log
    const rows = Array.isArray(result) ? result : result.rows || [];
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('DB-Fehler:', error.message, error.stack);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

app.put('/api/licenses', async (req, res) => {
  try {
    const { id, category, tags, name, utm_writing } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID erforderlich' });
    }
    const result = await sql`
      UPDATE licenses
      SET category = ${category}, tags = ${tags}, name = ${name}, utm_writing = ${utm_writing}
      WHERE id = ${id}
      RETURNING *;
    `;
    const rows = Array.isArray(result) ? result : result.rows || [];
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('DB-Fehler:', error.message, error.stack);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

app.delete('/api/licenses', async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID erforderlich' });
    }
    await sql`DELETE FROM licenses WHERE id = ${id};`;
    res.status(204).end();
  } catch (error) {
    console.error('DB-Fehler:', error.message, error.stack);
    res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend läuft auf http://localhost:${PORT}/api/licenses`);
});