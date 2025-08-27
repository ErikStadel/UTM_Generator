import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  console.log('Validate API aufgerufen:', req.method, req.body);
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name erforderlich' });
    }

    const result = await sql`SELECT id, name, role FROM users WHERE name = ${name.toLowerCase()};`;
    console.log('Datenbankergebnis:', result);
    const user = result[0];
    if (!user) {
      return res.status(401).json({ error: 'Ungültiger User' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '180d' }
    );
    res.setHeader(
      'Set-Cookie',
      `userToken=${token}; HttpOnly; Secure; Max-Age=${180 * 24 * 60 * 60}; Path=/; SameSite=Strict`
    );

    return res.status(200).json({ name: user.name, role: user.role });
  } catch (error) {
    console.error('Fehler:', error);
    return res.status(500).json({ error: 'Serverfehler', details: error.message });
  }
}