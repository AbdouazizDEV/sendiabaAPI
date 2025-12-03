const fs = require('fs');
const path = require('path');

// Lire le fichier .env
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ Le fichier .env n\'existe pas !');
  console.log('📝 Créez un fichier .env à la racine du projet.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

// Vérifier les variables PayDunya
const requiredVars = {
  'PAYDUNYA_MODE': false,
  'PAYDUNYA_TEST_MASTER_KEY': false,
  'PAYDUNYA_TEST_PRIVATE_KEY': false,
  'PAYDUNYA_TEST_PUBLIC_KEY': false,
  'PAYDUNYA_TEST_TOKEN': false,
  'API_BASE_URL': false,
  'FRONTEND_URL': false,
};

const foundVars = {};

envLines.forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key] = trimmed.split('=');
    if (key && requiredVars.hasOwnProperty(key.trim())) {
      foundVars[key.trim()] = true;
      const value = trimmed.split('=').slice(1).join('=').trim();
      if (value && value !== '') {
        requiredVars[key.trim()] = true;
      }
    }
  }
});

console.log('\n🔍 Vérification de la configuration PayDunya\n');
console.log('='.repeat(50));

let allConfigured = true;

Object.keys(requiredVars).forEach((key) => {
  const isConfigured = requiredVars[key];
  const status = isConfigured ? '✅' : '❌';
  const value = isConfigured ? 'Configuré' : 'MANQUANT ou VIDE';
  
  console.log(`${status} ${key}: ${value}`);
  
  if (!isConfigured) {
    allConfigured = false;
  }
});

console.log('='.repeat(50));

if (!allConfigured) {
  console.log('\n⚠️  Configuration incomplète !\n');
  console.log('📝 Ajoutez les variables suivantes dans votre fichier .env :\n');
  
  Object.keys(requiredVars).forEach((key) => {
    if (!requiredVars[key]) {
      if (key === 'PAYDUNYA_MODE') {
        console.log(`${key}=test`);
      } else if (key.startsWith('PAYDUNYA_TEST_')) {
        console.log(`${key}=votre_${key.toLowerCase().replace('paydunya_test_', '')}_ici`);
      } else if (key === 'API_BASE_URL') {
        console.log(`${key}=http://localhost:3000`);
      } else if (key === 'FRONTEND_URL') {
        console.log(`${key}=http://localhost:4200`);
      }
    }
  });
  
  console.log('\n📚 Consultez docs/PAYDUNYA_CONFIGURATION.md pour plus d\'informations.\n');
  process.exit(1);
} else {
  console.log('\n✅ Toutes les variables PayDunya sont configurées !\n');
  console.log('💡 Assurez-vous que les clés sont correctes et récupérées depuis votre compte PayDunya.\n');
  process.exit(0);
}




