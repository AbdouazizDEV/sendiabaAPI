// Script de test pour vérifier la configuration email
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

console.log('🔍 Test de connexion au serveur email...');
console.log('Host:', process.env.MAIL_HOST);
console.log('Port:', process.env.MAIL_PORT);
console.log('User:', process.env.MAIL_USER);
console.log('Password:', process.env.MAIL_PASSWORD ? '***' + process.env.MAIL_PASSWORD.slice(-4) : 'NON DÉFINI');
console.log('');

transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Erreur de connexion:', error.message);
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔐 Erreur d\'authentification Gmail');
      console.log('📋 Solutions :');
      console.log('   1. Activez l\'authentification à deux facteurs');
      console.log('   2. Générez un mot de passe d\'application : https://myaccount.google.com/apppasswords');
      console.log('   3. Utilisez le mot de passe d\'application dans MAIL_PASSWORD');
    }
  } else {
    console.log('✅ Connexion réussie ! Le serveur email est prêt à envoyer des emails.');
  }
});
