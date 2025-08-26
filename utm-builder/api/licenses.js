const { neon } = require('@neondatabase/serverless');
const { config } = require('dotenv');

config(); // Lädt .env-Variablen für lokale Tests

const sql = neon(process.env.DATABASE_URL);

exports.getLicenses = async (req, res) => {
  try {
    const searchTerm = req.query.search || '';
    const result = await sql`
      SELECT category, name, tags, utm_writing
      FROM licenses
      WHERE (category ILIKE ${`%${searchTerm}%`} OR name ILIKE ${`%${searchTerm}%`} OR tags ILIKE ${`%${searchTerm}%`})
      GROUP BY category, name, tags, utm_writing
      ORDER BY category, name;
    `;
    const licensesByCategory = result.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = [];
      acc[row.category].push({ name: row.name, tags: row.tags, utm_writing: row.utm_writing });
      return acc;
    }, {});
    res.json(licensesByCategory);
  } catch (error) {
    console.error('Fehler beim Abrufen der Lizenzen:', error.message);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};