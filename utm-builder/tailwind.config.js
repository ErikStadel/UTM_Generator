/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scanne alle JS/JSX-Dateien in src
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Blau für primäre Aktionen
        secondary: '#4b5563', // Grau für sekundäre Elemente
        success: '#10b981', // Grün für Erfolgszustände
        error: '#ef4444', // Rot für Fehler
        background: '#f9fafb', // Heller Hintergrund
        card: '#ffffff', // Weiß für Karten
        border: '#e5e7eb', // Heller Rahmen
      },
    },
  },
  plugins: [],
};