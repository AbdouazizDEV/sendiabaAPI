import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Sendiaba API Documentation')
    .setDescription('API Backend pour la marketplace Sendiaba')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag(
      '🔐 Authentication',
      "Endpoints pour l'authentification et la gestion des sessions",
    )
    .addTag('👤 Profile Management', 'Gestion du profil utilisateur')
    .addTag('📍 Addresses', 'Gestion des adresses utilisateur')
    .addTag('⚙️ Preferences', 'Gestion des préférences utilisateur')
    .addTag('🔒 Sécurité et Confidentialité', 'Gestion de la sécurité et confidentialité')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
};
