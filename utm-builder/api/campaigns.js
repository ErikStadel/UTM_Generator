import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(req, res) {
  try {
    // Authentifizierung
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.userToken;
    if (!token) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Ungültiges Token' });
    }

    const sql = neon(process.env.DATABASE_URL);
    console.log('API aufgerufen:', req.method, process.env.DATABASE_URL);

    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM campaigns;`;
      console.log('Rohdatenbankergebnis:', result);
      const rows = Array.isArray(result) ? result : result.rows || [];
      console.log('Verarbeitetes Ergebnis:', rows);
      if (rows.length === 0) {
        console.log('Keine Daten in der Tabelle gefunden.');
      }
      return res.status(200).json(rows);
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
      const rows = Array.isArray(result) ? result : result.rows || [];
      return res.status(201).json(rows[0]);
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
      const rows = Array.isArray(result) ? result : result.rows || [];
      return res.status(200).json(rows[0]);
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
    console.error('Datenbankfehler:', error.message, error.stack);
    return res.status(500).json({ error: 'Interner Serverfehler', details: error.message });
  }
}