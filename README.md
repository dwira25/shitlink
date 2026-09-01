# ShortLink - Self-Hosted URL Shortener

Self-hosted URL shortener with rating system, QR codes, analytics, and admin dashboard.

## Features

- **URL Shortening**: Create custom short URLs
- **Rating System**: Optional rating page before redirect with minimum rating threshold
- **QR Codes**: Auto-generate QR codes for every link (SVG/PNG)
- **Analytics Dashboard**: Track clicks, locations, devices, browsers
- **Bulk Management**: Activate/deactivate/delete multiple links at once
- **Multi-user**: Role-based access control (admin/master/user)
- **Security**: CSRF protection, rate limiting, JWT authentication

## Tech Stack

**Frontend**:
- Vue 3 + TypeScript + Vite
- Tailwind CSS
- Pinia (state management)
- Vue Router
- Chart.js (analytics charts)

**Backend**:
- Node.js + Express + TypeScript
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)
- JWT authentication
- Zod validation

## Quick Start (Development)

```bash
# Install dependencies
npm install

# Setup database
npm run prisma:generate
npm run prisma:migrate
npm run seed

# Start backend (port 3001)
npm run dev:backend

# Start frontend (port 5173)
npm run dev:frontend
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Deployment to Vercel

### 1. Prepare Environment Variables

Create `.env.local` or set in Vercel dashboard:

```env
DATABASE_URL="postgresql://..."  # PostgreSQL connection string
JWT_SECRET="your-secure-jwt-secret"
APP_ORIGIN="https://yourdomain.vercel.app"
APP_DOMAIN="yourdomain.vercel.app"
NODE_ENV="production"
PORT=3001
```

### 2. Database Setup

For production, use PostgreSQL:

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect via Vercel dashboard:
1. Import GitHub repository
2. Configure build settings:
   - Root directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `frontend/dist` (for frontend)
3. Set environment variables

### 4. Vercel Configuration

The `vercel.json` file includes:
- API routes → backend serverless functions
- Static files → frontend build
- Landing page → `/`
- Admin panel → `/admin/*`
- Rating pages → `/r/:slug`
- Redirects → `/:slug`

## Project Structure

```
shortlink/
├── backend/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/        # API routes
│   │   └── ...
│   └── prisma/            # Database schema
├── frontend/              # Vue frontend
│   ├── src/
│   │   ├── pages/         # Vue pages
│   │   ├── components/    # Reusable components
│   │   └── ...
└── vercel.json            # Vercel deployment config
```

## API Endpoints

- `POST /api/links` - Create short link
- `GET /api/links` - List links
- `GET /:slug` - Redirect to destination
- `GET /r/:slug` - Rating page
- `POST /api/ratings/:slug` - Submit rating
- `GET /api/analytics/:id` - Get link analytics

## Rating System Workflow

1. **When ratingEnabled = false**:
   - `/:slug` → direct redirect to destination
   - `/r/:slug` → redirect to destination (no rating)

2. **When ratingEnabled = true**:
   - `/:slug` → redirect to `/r/:slug`
   - `/r/:slug` → rating page HTML
   - User submits rating → if score >= minRating → redirect to destination

## Development Notes

- **Hot Reload**: Both frontend and backend support hot reload
- **TypeScript**: Full type safety across frontend and backend
- **Testing**: Vitest for unit tests
- **Linting**: ESLint + TypeScript checking

## Troubleshooting

**Database errors**:
```bash
npm run prisma:generate
npm run prisma:migrate
```

**Build errors**:
```bash
npm run build  # Runs both backend and frontend builds
```

**CORS issues**: Ensure `APP_ORIGIN` matches your frontend URL

## License

MIT