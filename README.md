# Stinkout

A community-driven platform to expose unethical recruiters and hiring practices. Built with Next.js and SQLite.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** SQLite via better-sqlite3
- **Styling:** Tailwind CSS with custom Toxic Swamp theme
- **Language:** TypeScript
- **Auth:** Session-based with crypto password hashing

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> If you have an existing database from a previous version, delete `data/stinkout.db` to recreate the schema.

## Project Structure

```
src/
├── app/
│   ├── admin/reviews/          # Admin panel (moderate reviews)
│   ├── api/
│   │   ├── admin/              # admin endpoints
│   │   ├── auth/               # register, login, logout, me
│   │   ├── recruiters/         # recruiter search & detail
│   │   ├── companies/          # company search & detail
│   │   ├── reviews/            # review CRUD (with evidence)
│   │   └── evidence/           # evidence upload & validation
│   ├── recruiters/[id]/        # recruiter profile
│   ├── companies/[id]/         # company profile
│   ├── review/                 # submit review form
│   ├── search/                 # search results
│   ├── profile/                # user profile
│   ├── login/                  # sign in
│   └── register/               # sign up
├── components/
│   ├── Header.tsx              # nav with auth state
│   ├── EvidenceSection.tsx     # evidence display + validate + add more
│   └── ReviewActions.tsx       # edit/delete own review
└── lib/
    ├── db.ts                   # database connection & schema
    ├── auth.ts                 # password hashing & session management
    └── types.ts                # TypeScript interfaces
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account (first user = admin) |
| POST | `/api/auth/login` | No | Sign in |
| POST | `/api/auth/logout` | No | Sign out |
| GET | `/api/auth/me` | No | Get current user |
| GET | `/api/recruiters?q=` | No | Search recruiters |
| GET | `/api/recruiters/[id]` | No | Recruiter with reviews & evidence |
| GET | `/api/companies?q=` | No | Search companies |
| GET | `/api/companies/[id]` | No | Company with reviews & evidence |
| GET | `/api/reviews?recruiterId=&sort=&limit=&offset=` | No | List reviews |
| POST | `/api/reviews` | Yes | Submit review with evidence (multipart) |
| PATCH | `/api/reviews/[id]` | Yes | Edit own review |
| DELETE | `/api/reviews/[id]` | Yes | Delete own review |
| POST | `/api/evidence` | Yes | Add evidence to existing review |
| POST | `/api/evidence/[id]/validate` | Yes | Validate evidence |
| GET | `/api/admin/reviews` | Admin | List pending reviews |
| PATCH | `/api/admin/reviews/[id]` | Admin | Approve/reject review |
| DELETE | `/api/admin/evidence/[id]` | Admin | Delete evidence |

## File Upload Rules

- Max file size: 10MB
- Allowed types: images (JPEG, PNG, GIF, WebP), PDF, TXT, EML

## Color Theme

"Toxic Swamp" — dark background with lime-green accents.


¿Alguna vez viviste un proceso de selección poco ético o sufriste el "ghosting" de un reclutador? No te quedes callado.

La transparencia en el mercado laboral comienza con nosotros. Si una empresa o reclutador no respeta tu tiempo y profesionalismo, es momento de exponerlo para que nadie más caiga en esas prácticas.

Haz tu denuncia anónima aquí: https://stinkout.vercel.app