import { db } from '@vercel/postgres';

export default async function handler(req, res) {
  const client = await db.connect();

  try {
    if (req.method === 'GET') {
      const { rows } = await client.sql`SELECT * FROM campaigns;`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { name, category } = req.body;
      if (!name || !category) {
        return res.status(400).json({ error: 'Name und Kategorie erforderlich' });
      }
      const { rows } = await client.sql`
        INSERT INTO campaigns (name, category, archived)
        VALUES (${name}, ${category}, FALSE)
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, category, archived } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID erforderlich' });
      }
      const { rows } = await client.sql`
        UPDATE campaigns
        SET name = ${name}, category = ${category}, archived = ${archived}
        WHERE id = ${id}
        RETURNING *;
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID erforderlich' });
      }
      await client.sql`DELETE FROM campaigns WHERE id = ${id};`;
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  } finally {
    client.release();
  }
}
