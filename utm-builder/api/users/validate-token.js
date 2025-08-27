import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token erforderlich' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ name: payload.name, role: payload.role });
  } catch (error) {
    console.error('Fehler beim Validieren des Tokens:', error);
    return res.status(401).json({ error: 'Ungültiges Token' });
  }
}