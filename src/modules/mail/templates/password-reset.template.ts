export interface PasswordResetTemplateData {
  firstName: string;
  resetLink: string;
  resetToken: string;
}

export const passwordResetTemplate = (
  data: PasswordResetTemplateData,
): string => {
  const { firstName, resetLink } = data;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation de mot de passe - Sendiaba</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .email-header {
            background: linear-gradient(135deg, #0078FA 0%, #0056b3 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        
        .email-body {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #333333;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #666666;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        
        .button-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .reset-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #0078FA 0%, #0056b3 100%);
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(0, 120, 250, 0.3);
        }
        
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 120, 250, 0.4);
        }
        
        .token-info {
            background-color: #f8f9fa;
            border-left: 4px solid #0078FA;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .token-label {
            font-size: 14px;
            color: #666666;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .token-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #333333;
            word-break: break-all;
        }
        
        .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 30px 0;
            border-radius: 4px;
        }
        
        .warning-text {
            font-size: 14px;
            color: #856404;
            line-height: 1.6;
        }
        
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer-text {
            font-size: 14px;
            color: #666666;
            margin-bottom: 10px;
        }
        
        .footer-link {
            color: #0078FA;
            text-decoration: none;
        }
        
        .footer-link:hover {
            text-decoration: underline;
        }
        
        .social-links {
            margin-top: 20px;
        }
        
        .social-link {
            display: inline-block;
            margin: 0 10px;
            color: #0078FA;
            text-decoration: none;
            font-size: 14px;
        }
        
        @media only screen and (max-width: 600px) {
            .email-body {
                padding: 30px 20px;
            }
            
            .greeting {
                font-size: 20px;
            }
            
            .reset-button {
                padding: 14px 30px;
                font-size: 14px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <img src="https://res.cloudinary.com/dao8m0if6/image/upload/v1764489247/LogoSendiaba_tfoi39.png" alt="Sendiaba Logo" class="logo" />
        </div>
        
        <div class="email-body">
            <h1 class="greeting">Bonjour ${firstName},</h1>
            
            <p class="message">
                Vous avez demandé à réinitialiser votre mot de passe pour votre compte Sendiaba. 
                Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
            </p>
            
            <div class="button-container">
                <a href="${resetLink}" class="reset-button">Réinitialiser mon mot de passe</a>
            </div>
            
            <div class="token-info">
                <div class="token-label">Ou copiez ce lien dans votre navigateur :</div>
                <div class="token-value">${resetLink}</div>
            </div>
            
            <div class="warning">
                <p class="warning-text">
                    <strong>⚠️ Important :</strong> Ce lien de réinitialisation est valide pendant <strong>1 heure</strong> seulement. 
                    Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. 
                    Votre mot de passe ne sera pas modifié tant que vous n'aurez pas cliqué sur le lien ci-dessus.
                </p>
            </div>
            
            <p class="message" style="margin-top: 30px; font-size: 14px; color: #999999;">
                Si le bouton ne fonctionne pas, copiez et collez le lien ci-dessus dans votre navigateur.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                Cet email a été envoyé par <strong>Sendiaba</strong>, votre marketplace sénégalaise de confiance.
            </p>
            <p class="footer-text">
                Si vous avez des questions, n'hésitez pas à nous contacter à 
                <a href="mailto:support@sendiaba.com" class="footer-link">support@sendiaba.com</a>
            </p>
            <div class="social-links">
                <a href="#" class="social-link">Facebook</a> |
                <a href="#" class="social-link">Twitter</a> |
                <a href="#" class="social-link">Instagram</a>
            </div>
            <p class="footer-text" style="margin-top: 20px; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} Sendiaba. Tous droits réservés.
            </p>
        </div>
    </div>
</body>
</html>
  `;
};
