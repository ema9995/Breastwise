// testSupabase.js
const supabase = require('./supabaseClient');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Test de connexion Supabase...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Définie' : '❌ Manquante');
  console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Définie' : '❌ Manquante');
  console.log('');
  
  try {
    console.log('🔄 Tentative de connexion...');
    
    // Test simple : récupérer les utilisateurs
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      console.error('   Code:', error.code);
      console.error('   Détails:', error.details);
      console.error('\n💡 Vérifiez que:');
      console.error('   1. RLS est désactivé ou une politique permet la lecture');
      console.error('   2. Le nom de la table est correct (users)');
      console.error('   3. Vos clés API sont correctes');
      return;
    }
    
    console.log('✅ Connexion réussie !');
    console.log('📊 Nombre de résultats:', data ? data.length : 0);
    console.log('📊 Données:', data);
    
    // Si la table est vide, c'est normal
    if (data.length === 0) {
      console.log('\n💡 La table est vide, c\'est normal pour un nouveau projet.');
    }
    
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message);
    console.error('   Stack:', err.stack);
  }
  
  console.log('\n✨ Test terminé.');
  process.exit(0); // Forcer la sortie
}

testConnection();