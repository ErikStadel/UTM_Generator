import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config(); // Lädt .env-Variablen für lokale Tests

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM campaigns;`;
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
    console.error('Datenbankfehler:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}