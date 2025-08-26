import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config(); // Lädt .env-Variablen für lokale Tests

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    console.log('API aufgerufen:', req.method, process.env.DATABASE_URL); // Debug-Log
    if (req.method === 'GET') {
      const searchTerm = req.query.search || '';
      const result = await sql`
        SELECT id, category, name, tags, utm_writing
        FROM licenses
        WHERE (category ILIKE ${`%${searchTerm}%`} OR name ILIKE ${`%${searchTerm}%`} OR tags ILIKE ${`%${searchTerm}%`})
        GROUP BY id, category, name, tags, utm_writing
        ORDER BY category, name;
      `;
      console.log('Rohdatenbankergebnis:', result); // Debug-Log
      const rows = Array.isArray(result) ? result : result.rows || [];
      const licensesByCategory = rows.reduce((acc, row) => {
        if (!acc[row.category]) acc[row.category] = [];
        acc[row.category].push({ id: row.id, name: row.name, tags: row.tags, utm_writing: row.utm_writing });
        return acc;
      }, {});
      console.log('Verarbeitetes Ergebnis:', licensesByCategory); // Debug-Log
      if (Object.keys(licensesByCategory).length === 0) {
        console.log('Keine Lizenzen gefunden.');
      }
      return res.status(200).json(licensesByCategory);
    }

    if (req.method === 'POST') {
      const { category, tags, name, utm_writing } = req.body;
      console.log('POST-Daten:', { category, tags, name, utm_writing }); // Zusätzlicher Debug-Log
      if (!category || !name || !utm_writing) {
        return res.status(400).json({ error: 'Kategorie, Name und UTM-Schreibweise erforderlich' });
      }
      const result = await sql`
        INSERT INTO licenses (category, tags, name, utm_writing)
        VALUES (${category}, ${tags}, ${name}, ${utm_writing})
        RETURNING *;
      `;
      console.log('INSERT-Ergebnis:', result); // Debug-Log für INSERT
      const rows = Array.isArray(result) ? result : result.rows || [];
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
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
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID erforderlich' });
      }
      await sql`DELETE FROM licenses WHERE id = ${id};`;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (error) {
    console.error('Datenbankfehler:', error.message, error.stack); // Detaillierter Fehler
    return res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
}