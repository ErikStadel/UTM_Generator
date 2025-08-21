import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config(); // Lädt .env-Variablen für lokale Tests

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    console.log('API aufgerufen:', req.method, process.env.DATABASE_URL); // Debug-Log
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM campaigns;`;
      console.log('Datenbankergebnis:', result.rows); // Debug-Log
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { name, category } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie erforderlich' });
      }
      const result = await sql`
        INSERT INTO campaigns (name, category, archived)
        VALUES (${name}, ${category}, FALSE)
        RETURNING *;
      `;
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, category, archived } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID erforderlich' });
      }
      const result = await sql`
        UPDATE campaigns
        SET name = ${name}, category = ${category}, archived = ${archived}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID erforderlich' });
      }
      await sql`DELETE FROM campaigns WHERE id = ${id};`;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (error) {
    console.error('Datenbankfehler:', error.message);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}