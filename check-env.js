// Script pour vérifier la configuration .env
require('dotenv').config();

console.log('🔍 Vérification de la configuration email...\n');

const mailUser = process.env.MAIL_USER;
const mailPassword = process.env.MAIL_PASSWORD;
const mailHost = process.env.MAIL_HOST;
const mailPort = process.env.MAIL_PORT;

console.log('MAIL_HOST:', mailHost || '❌ NON DÉFINI');
console.log('MAIL_PORT:', mailPort || '❌ NON DÉFINI');
console.log('MAIL_USER:', mailUser || '❌ NON DÉFINI');

if (mailUser) {
  if (mailUser.includes('votre_email') || mailUser.includes('example')) {
    console.log('⚠️  PROBLÈME : MAIL_USER contient encore une valeur par défaut !');
    console.log('   Remplacez "votre_email@gmail.com" par votre vraie adresse email');
  } else {
    console.log('✅ MAIL_USER semble correct');
  }
} else {
  console.log('❌ MAIL_USER n\'est pas défini');
}

if (mailPassword) {
  if (mailPassword.includes('votre_mot_de_passe') || mailPassword.includes('password')) {
    console.log('⚠️  PROBLÈME : MAIL_PASSWORD contient encore une valeur par défaut !');
    console.log('   Remplacez par votre mot de passe d\'application Gmail');
  } else if (mailPassword.length < 10) {
    console.log('⚠️  PROBLÈME : MAIL_PASSWORD semble trop court');
    console.log('   Un mot de passe d\'application Gmail fait 16 caractères');
  } else {
    console.log('✅ MAIL_PASSWORD semble correct (longueur:', mailPassword.length, 'caractères)');
  }
} else {
  console.log('❌ MAIL_PASSWORD n\'est pas défini');
}

console.log('\n📋 Pour générer un mot de passe d\'application :');
console.log('   https://myaccount.google.com/apppasswords');
