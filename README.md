# marton.ai & Raumblick360 Business Dashboard

Ein internes Business Intelligence Dashboard für die Überwachung von SaaS- und Agentur-Metriken.

## Features

- **Gesamtübersicht**: Kombinierte Metriken aus SaaS und Agentur
- **SaaS (marton.ai)**: MRR, ARR, Abonnenten, Einzelkäufe, Churn
- **Agentur (Raumblick360)**: Umsatz, Aufträge, Durchschnittswerte
- **Software Insights**: Userbase, Conversions, CLV, ARPU, Rabatte

## Datenquellen

- **Stripe** (2 Accounts): marton.ai SaaS & Raumblick360 Agentur
- **Google Sheets**: Manuelle/Sonder-Abos
- **Firebase**: User-Daten
- **Sevdesk**: (vorbereitet, noch nicht implementiert)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **APIs**: Stripe, Google Sheets CSV, Firebase Admin

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## Deployment auf Vercel (Kostenlos)

### Option 1: Via Vercel CLI

```bash
# Vercel CLI installieren
npm i -g vercel

# Deployen
vercel

# Für Production
vercel --prod
```

### Option 2: Via GitHub + Vercel Dashboard

1. Push das Projekt zu GitHub
2. Gehe zu [vercel.com](https://vercel.com)
3. "New Project" → GitHub Repo auswählen
4. Environment Variables hinzufügen (siehe unten)
5. Deploy

### Environment Variables (in Vercel Dashboard)

```
STRIPE_SECRET_KEY_SAAS=sk_live_51RKK9tI5WHSNN7wt...
STRIPE_SECRET_KEY_AGENCY=sk_live_51PL39cCSPYFni1Q0...
GOOGLE_SHEET_URL=https://docs.google.com/spreadsheets/d/.../export?format=csv
APP_PASSWORD=Raumblick360!123
FIREBASE_PROJECT_ID=marton-ai-prod
FIREBASE_CLIENT_EMAIL=analytics-automations@marton-ai-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

**Wichtig**: Bei `FIREBASE_PRIVATE_KEY` müssen die Zeilenumbrüche als `\n` geschrieben werden.

## Alternative: Deployment auf Railway

1. Gehe zu [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Environment Variables hinzufügen
4. Automatisches Deployment

## Alternative: Deployment auf Render

1. Gehe zu [render.com](https://render.com)
2. "New Web Service" → GitHub Repo
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Environment Variables hinzufügen

## Passwort-Schutz

Das Dashboard ist passwortgeschützt. Standard-Passwort: `Raumblick360!123`

Änderbar über die Environment Variable `APP_PASSWORD`.

## Struktur

```
src/
├── app/
│   ├── api/
│   │   ├── auth/route.js    # Login-API
│   │   └── data/route.js    # Haupt-Daten-API
│   ├── globals.css          # Styling
│   ├── layout.js            # Root Layout
│   └── page.js              # Haupt-Dashboard
├── components/
│   ├── Charts.js            # Recharts Komponenten
│   ├── DatePicker.js        # Zeitraum-Auswahl
│   ├── LoginScreen.js       # Passwort-Eingabe
│   ├── MetricCard.js        # Metriken-Karten
│   └── Navigation.js        # Tab-Navigation
└── lib/
    ├── firebase.js          # Firebase Admin SDK
    ├── sheets.js            # Google Sheets Parser
    ├── stripe.js            # Stripe API Logik
    └── utils.js             # Hilfsfunktionen
```

## Sevdesk Integration (TODO)

Die Sevdesk-Integration ist vorbereitet aber noch nicht aktiv. Um sie zu aktivieren:

1. Sevdesk API-Key in `.env.local` hinzufügen
2. `src/lib/sevdesk.js` erstellen mit API-Logik
3. In `src/app/api/data/route.js` einbinden

## Support

Bei Fragen: [Deine Kontaktinfo]
