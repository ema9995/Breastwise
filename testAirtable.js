// testAirtable.js
const { fetchUsers, createEnergyLog } = require("./airtableClient");

async function main() {
  const users = await fetchUsers();
  console.log("Utilisateurs :", users);

  const newLog = await createEnergyLog({
    user_id: "U001",
    date: "2025-02-25",
    energy_level: 6,
    fatigue_level: 4,
    mood: 7,
    notes: "Test depuis BreastWise",
  });

  console.log("Nouveau log créé :", newLog.fields);
}

main().catch(console.error);