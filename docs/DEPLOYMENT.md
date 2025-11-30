# Guide de déploiement - Sendiaba API

## Prérequis

- Node.js v18 ou supérieur
- PostgreSQL v12 ou supérieur
- npm ou yarn
- Accès SSH au serveur (pour déploiement production)

## Déploiement en développement

### 1. Configuration locale

```bash
# Cloner le projet
git clone <repository-url>
cd SendiabaAPI

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos configurations locales
```

### 2. Configuration de la base de données

```bash
# Créer la base de données
createdb sendiaba_db

# Ou avec psql
psql -U postgres
CREATE DATABASE sendiaba_db;
CREATE USER sendiaba WITH PASSWORD 'sendiaba_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sendiaba_db TO sendiaba;
\q
```

### 3. Lancer l'application

```bash
# Mode développement (avec watch)
npm run start:dev

# L'application sera accessible sur http://localhost:3000
# Swagger sur http://localhost:3000/api/docs
```

## Déploiement en production

### 1. Préparation du serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js (si pas déjà installé)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

### 2. Configuration PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données et l'utilisateur
CREATE DATABASE sendiaba_db;
CREATE USER sendiaba WITH PASSWORD 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE sendiaba_db TO sendiaba;
ALTER USER sendiaba CREATEDB;
\q
```

### 3. Déploiement de l'application

```bash
# Cloner le projet sur le serveur
git clone <repository-url> /var/www/sendiaba-api
cd /var/www/sendiaba-api

# Installer les dépendances
npm install --production

# Créer le fichier .env de production
nano .env
```

**Configuration .env de production :**
```env
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sendiaba
DB_PASSWORD=votre_mot_de_passe_securise
DB_DATABASE=sendiaba_db

JWT_SECRET=votre_secret_jwt_super_securise_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=votre_refresh_secret_super_securise_production
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=https://votre-domaine.com

BCRYPT_SALT_ROUNDS=12
```

### 4. Compilation et démarrage

```bash
# Compiler l'application
npm run build

# Démarrer avec PM2
pm2 start dist/main.js --name sendiaba-api

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

### 5. Configuration Nginx (reverse proxy)

```bash
# Installer Nginx
sudo apt install nginx

# Créer la configuration
sudo nano /etc/nginx/sites-available/sendiaba-api
```

**Configuration Nginx :**
```nginx
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/sendiaba-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configuration SSL avec Let's Encrypt

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d api.votre-domaine.com

# Le certificat sera renouvelé automatiquement
```

## Migrations de base de données

### En développement

```bash
# Générer une migration
npm run migration:generate -- src/database/migrations/NomDeLaMigration

# Exécuter les migrations
npm run migration:run

# Annuler la dernière migration
npm run migration:revert
```

### En production

```bash
# Exécuter les migrations avant le déploiement
npm run migration:run
```

## Monitoring et logs

### PM2

```bash
# Voir les logs
pm2 logs sendiaba-api

# Voir le statut
pm2 status

# Redémarrer l'application
pm2 restart sendiaba-api

# Arrêter l'application
pm2 stop sendiaba-api
```

### Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

## Sauvegarde de la base de données

```bash
# Créer un script de sauvegarde
nano /usr/local/bin/backup-sendiaba-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/sendiaba"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U sendiaba sendiaba_db > $BACKUP_DIR/sendiaba_db_$DATE.sql
# Garder seulement les 7 derniers backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
# Rendre exécutable
chmod +x /usr/local/bin/backup-sendiaba-db.sh

# Ajouter au cron (sauvegarde quotidienne à 2h du matin)
crontab -e
# Ajouter : 0 2 * * * /usr/local/bin/backup-sendiaba-db.sh
```

## Mise à jour de l'application

```bash
# Se connecter au serveur
ssh user@server

# Aller dans le dossier de l'application
cd /var/www/sendiaba-api

# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install --production

# Exécuter les migrations si nécessaire
npm run migration:run

# Recompiler
npm run build

# Redémarrer l'application
pm2 restart sendiaba-api
```

## Variables d'environnement critiques

⚠️ **IMPORTANT** : En production, assurez-vous que :

1. `JWT_SECRET` et `JWT_REFRESH_SECRET` sont des chaînes aléatoires sécurisées
2. `DB_PASSWORD` est un mot de passe fort
3. `NODE_ENV=production` est défini
4. `synchronize: false` dans la configuration TypeORM (utiliser les migrations)

## Sécurité

### Firewall

```bash
# Configurer UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Mise à jour régulière

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Mettre à jour Node.js si nécessaire
npm install -g npm@latest
```

## Dépannage

### L'application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs sendiaba-api --lines 100

# Vérifier la connexion à la base de données
psql -U sendiaba -d sendiaba_db -h localhost
```

### Erreurs de connexion à la base de données

```bash
# Vérifier que PostgreSQL est en cours d'exécution
sudo systemctl status postgresql

# Vérifier la configuration pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

### Problèmes de permissions

```bash
# Vérifier les permissions du dossier
sudo chown -R $USER:$USER /var/www/sendiaba-api
```

## Support

Pour toute question ou problème, consulter :
- Documentation NestJS : https://docs.nestjs.com
- Documentation TypeORM : https://typeorm.io
- Issues GitHub du projet


