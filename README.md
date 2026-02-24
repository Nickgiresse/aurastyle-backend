# Aura & Style - Backend API

Backend Node.js + Express + MongoDB pour l'e-commerce Aura & Style.

## Prérequis

- Node.js 18+
- Compte MongoDB Atlas (gratuit)

## Installation

```bash
npm install
```

## Configuration

1. Copiez `.env.example` vers `.env`
2. Remplissez `MONGODB_URI` avec votre chaîne de connexion MongoDB Atlas
3. Ajustez `CLIENT_URL` si nécessaire (défaut: http://localhost:3000)

## Scripts

```bash
# Démarrer en mode développement
npm run dev

# Peupler la base de données (catégories, produits, admin)
npm run seed

# Build production
npm run build

# Démarrer en production
npm start
```

## Compte admin (après seed)

- **Email:** admin@aura.com
- **Mot de passe:** admin123

## Endpoints API

### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil (protégé)

### Produits
- `GET /api/products` - Liste (query: category, sort, page, limit)
- `GET /api/products/search?q=` - Recherche
- `GET /api/products/:id` - Détail

### Commandes (protégé)
- `POST /api/orders` - Créer commande
- `GET /api/orders/mine` - Mes commandes

### Admin (protégé + admin)
- `GET/POST/PUT/DELETE /api/admin/products`
- `GET/PUT /api/admin/orders`
- `GET /api/admin/stats`

## Headers

Pour les routes protégées, ajoutez :
```
Authorization: Bearer <votre_token_jwt>
```
