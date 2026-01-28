// airtableClient.js
const Airtable = require("airtable");
const dotenv = require("dotenv");

dotenv.config(); // lit le fichier .env

const base = new Airtable({
  apiKey: process.env.AIRTABLE_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID);

// Récupérer les utilisateurs
async function fetchUsers() {
  const records = await base("Utilisateurs").select({ maxRecords: 15 }).all();
  return records.map((rec) => ({
    id: rec.id,
    ...rec.fields,
  }));
}

// Créer un log "Suivi Énergie et Fatigue"
async function createEnergyLog(data) {
  const records = await base("Suivi Énergie et Fatigue").create([
    {
      fields: {
        user_id: data.user_id,
        date: data.date,
        energy_level: data.energy_level,
        fatigue_level: data.fatigue_level,
        mood: data.mood,
        notes: data.notes || "",
      },
    },
  ]);
  return records[0];
}

module.exports = { fetchUsers, createEnergyLog };