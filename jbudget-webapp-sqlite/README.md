# JBudget - Applicazione Web/Mobile per Gestione Budget

## 📋 Descrizione
Applicazione web responsive per la gestione del budget familiare, fruibile sia da browser desktop che da dispositivi mobili.

## ✅ Requisiti Implementati

### 1. Fruibilità Web/Mobile
- ✅ Interfaccia web responsive progettata con React
- ✅ Design mobile-first con breakpoint responsive
- ✅ Progressive Web App (PWA) ready
- ✅ Compatibile con tutti i dispositivi moderni

### 2. Pattern MVC / Single Page Application
- ✅ **Single Page Application (SPA)** con React
- ✅ React Router per la navigazione client-side
- ✅ Separazione logica tra componenti (View), servizi (Controller) e stato (Model)
- ✅ Context API per la gestione dello stato globale

### 3. Backend + DBMS
- ✅ Backend RESTful API con Node.js + Express
- ✅ Database PostgreSQL per persistenza dati (embedded, nessun server richiesto)
- ✅ Autenticazione utenti con JWT
- ✅ Validazione dati lato server
- ✅ Migrations per gestione schema database

## 🏗️ Architettura

```
jbudget-webapp/
├── client/                 # Frontend React (SPA)
│   ├── public/            # File statici
│   ├── src/
│   │   ├── components/    # Componenti React riutilizzabili
│   │   ├── pages/         # Pagine principali dell'app
│   │   ├── services/      # Servizi API (Controller logic)
│   │   ├── context/       # Context API per stato globale
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.jsx        # Componente principale
│   └── package.json
│
├── server/                # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/   # Logic dei controller
│   │   ├── models/        # Modelli dati (Sequelize ORM)
│   │   ├── routes/        # Definizione route API
│   │   ├── middleware/    # Middleware (auth, validation)
│   │   ├── config/        # Configurazioni
│   │   └── server.js      # Entry point server
│   ├── migrations/        # Database migrations
│   └── package.json
│
└── README.md
```

## 🚀 Tecnologie Utilizzate

### Frontend
- **React 18** - Framework UI
- **React Router 6** - Routing SPA
- **Axios** - HTTP client
- **Chart.js** - Grafici statistiche
- **CSS Modules** - Styling componenti
- **Vite** - Build tool moderno

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Database relazionale
- **Sequelize** - ORM per PostgreSQL
- **JWT** - Autenticazione
- **bcrypt** - Hashing password
- **express-validator** - Validazione input

## 📦 Installazione

### Prerequisiti
- Node.js 18+ 
- npm o yarn

**Nota:** In Docker, PostgreSQL è avviato automaticamente come servizio nel compose.

### 1. Clona il repository
```bash
git clone <repository-url>
cd jbudget-webapp
```

### 2. Configurazione Backend
```bash
cd server
npm install

# Crea file .env (copia dall'esempio)
cp .env.example .env

# Modifica .env se necessario (credenziali PostgreSQL)
# Le tabelle verranno create automaticamente al primo avvio (DB_SYNC=true)
```

### 3. Configurazione Frontend
```bash
cd ../client
npm install

# Crea file .env
cat > .env << EOL
VITE_API_URL=http://localhost:5000/api
EOL
```

## 🏃‍♂️ Avvio Applicazione

### Modalità Sviluppo

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Server in ascolto su http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
# App disponibile su http://localhost:5173
```

### Modalità Produzione

#### Opzione A: Docker (consigliato)

1) Crea un file `.env` nella root (puoi partire da `.env.example`).

2) Avvia tutto con Docker Compose:

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- API: http://localhost:8080/api (passa da Nginx)
- Health check: http://localhost:8080/health

I dati PostgreSQL vengono persistiti in un volume Docker (`pgdata`).

#### Opzione B: Build manuale (senza Docker)

```bash
# Backend
cd server
npm ci
cp ../.env.example .env
npm start

# Frontend (in un altro terminale)
cd ../client
npm ci
VITE_API_URL=http://localhost:5000/api npm run build
npm run preview -- --host 0.0.0.0 --port 8080
```

## 🌐 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `POST /api/auth/login` - Login utente
- `GET /api/auth/me` - Info utente corrente

### Transazioni
- `GET /api/transactions` - Lista transazioni
- `POST /api/transactions` - Crea transazione
- `PUT /api/transactions/:id` - Aggiorna transazione
- `DELETE /api/transactions/:id` - Elimina transazione
- `GET /api/transactions/stats` - Statistiche

### Tag
- `GET /api/tags` - Lista tag
- `POST /api/tags` - Crea tag
- `PUT /api/tags/:id` - Aggiorna tag
- `DELETE /api/tags/:id` - Elimina tag

## 📱 Funzionalità

### Gestione Transazioni
- ✅ Aggiunta transazioni (entrate/uscite)
- ✅ Modifica e cancellazione
- ✅ Filtri per data, tipo, tag
- ✅ Ricerca testuale

### Gestione Tag
- ✅ Creazione categorie personalizzate
- ✅ Assegnazione multipla a transazioni
- ✅ Colori personalizzati

### Statistiche e Dashboard
- ✅ Bilancio totale in tempo reale
- ✅ Grafici entrate/uscite per periodo
- ✅ Distribuzione per categoria
- ✅ Trend temporali

### Multi-utente
- ✅ Sistema di autenticazione
- ✅ Dati privati per ogni utente
- ✅ Sessioni sicure con JWT

## 🎨 Responsive Design

L'applicazione si adatta a:
- 📱 Mobile (< 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (> 1024px)

## 🔒 Sicurezza

- Password hashate con bcrypt
- JWT per autenticazione stateless
- Protezione CSRF
- Validazione input server-side
- SQL injection protection (Sequelize ORM)
- HTTPS ready

## 📊 Database Schema

### Users
- id (PK)
- email (unique)
- password_hash
- name
- created_at

### Transactions
- id (PK)
- user_id (FK)
- amount
- type (INCOME/EXPENSE)
- date
- description
- created_at

### Tags
- id (PK)
- user_id (FK)
- name
- color
- created_at

### TransactionTags (Many-to-Many)
- transaction_id (FK)
- tag_id (FK)

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📝 Note di Sviluppo

### Pattern Architetturale
Il progetto implementa una **Single Page Application (SPA)** che soddisfa i requisiti:
- **View**: Componenti React con logica di presentazione
- **Controller**: Service layer che gestisce chiamate API
- **Model**: Stato applicazione (Context API) + Modelli Sequelize backend

### Persistenza Dati
A differenza dell'originale (XML files), ora utilizza:
- SQLite come **DBMS** embedded (nessun server separato richiesto)
- Migrations per versionare schema
- ORM (Sequelize) per type-safety
- Database salvato in un singolo file `database.sqlite`
- Facile backup (basta copiare il file)

## 💾 Database PostgreSQL

Per il deploy (e anche in locale con Docker) l'app usa **PostgreSQL** come database.

### Persistenza
- I dati sono salvati nel volume Docker `pgdata` (non perdi i dati se riavvii i container).

### Variabili d'ambiente
- `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` (vedi `.env.example`).
- `DB_SSL=true` se usi un Postgres gestito con TLS.

### Prima inizializzazione
Al primo avvio puoi lasciare `DB_SYNC=true` per far creare automaticamente le tabelle da Sequelize.
Quando passi a un ambiente più stabile, è meglio usare **migrations** (non incluse in questa versione).

## 👥 Autori
- Progetto originale: JBudget JavaFX
- Versione Web/Mobile: JBudget [Alessandro Mozzoni, Tommaso Ferretti, Mattia Farabollini, Alessandro Acciarresi]

## 📄 Licenza
MIT License
