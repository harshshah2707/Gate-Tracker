# GATE WARROOM 2026

**GATE WARROOM 2026** is a production-ready accountability and performance operating system for GATE Computer Science & Engineering (CSE) aspirants. This is NOT a generic study tracker—it is a habit-forming platform combining Duolingo-style streak mechanics, GitHub-style consistency logging, Strava-style peer pressure, and Discord-style community engagement.

The system is optimized solely for daily study consistency, honesty, and motivation. It is 100% free with no ads, paywalls, or monetization models.

---

## 🛠 Tech Stack

*   **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide icons, Recharts
*   **Backend**: NestJS, TypeScript, Swagger API docs
*   **Database**: PostgreSQL, Prisma ORM
*   **Realtime Communication**: Socket.IO for live study statuses and reaction feeds
*   **Containerization**: Docker & Docker Compose

---

## 📐 Scoring & Mechanics Engine

### 1. Readiness Score & Rank Projection
During onboarding, aspirants select their current preparation level, weak subjects, and target rank. 
*   **Readiness Score (0-100)**: Calculated by weighting preparation levels, target rank, and daily available study hours:
    $$\text{Readiness} = (\text{PrepLevel} \times 0.6) + (\text{AvailableHours} \times 0.25) + (\text{TargetRankScore} \times 0.15)$$
*   **Estimated Rank Range**: Dynamically estimated from the readiness score:
    - Minimum Rank: $\max(1, \text{round}(100000 \times e^{-0.08 \times \text{Readiness}}))$
    - Maximum Rank: $\max(2, \text{round}(150000 \times e^{-0.06 \times \text{Readiness}}))$

### 2. Trust Score System (0-100)
To prevent dishonest logs, users have a public Trust Score:
*   **Base Score**: 50.
*   **Verified Session (Timer-based)**: $+1$ point (up to max $+50$).
*   **Manual Log**: $-0.5$ points.
*   **Mock Test Logged**: $+5$ points.
*   **Suspicious Patterns** (e.g. logging $>12$ hours manually in 24 hours, or duplicate consecutive durations): $-5$ points.

### 3. Accountability Score System (0-100)
A daily indicator of how rigorously a student is sticking to their targets:
*   **Daily Consistency** (Studied $\ge 15$ mins today): 30% weight.
*   **Goal Completion** (Hours studied vs daily hours goal): 25% weight.
*   **Streak Health** (Current streak days multiplier): 20% weight.
*   **Revision Adherence** (Completed pending spaced repetition cards): 15% weight.
*   **Mock Test Frequency** (Target of 1 mock exam logged per week): 10% weight.

Aspirant levels based on Accountability Score:
*   `0-20`: 👻 Ghost
*   `21-40`: 😴 Sleeping
*   `41-60`: ✅ Active
*   `61-80`: ⚡ Consistent
*   `81-95`: 🔥 Beast
*   `96-100`: 🤖 Machine

### 4. Spaced Repetition (Revision Queue)
Completed topics can be logged into the revision queue with automatic spaced repetition triggers following step-up intervals:
$$\text{Intervals} = [1, 3, 7, 15, 30] \text{ days}$$
If a revision task passes its due date without completion, it is marked as `OVERDUE` and reduces the student's daily Accountability Score.

### 5. Study Debt System
Aspirants set a daily study target (e.g., 6 hours). Any daily shortfall is accumulated as **Study Debt**:
$$\text{Daily Debt} = \max(0, \text{Target Hours} - \text{Actual Hours Studied})$$
Accumulated weekly and monthly debts are highlighted on the dashboard to encourage catch-up sessions.

---

## 📂 Project Structure

```
gate-warroom/
├── apps/
│   ├── frontend/         # Next.js 14+ application
│   ├── backend/          # NestJS backend application
│   └── shared/           # Shared TypeScript types, constants & syllabus models
├── docker-compose.yml    # Docker configurations
├── README.md
└── .env.example          # Environment variables template
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
*   Node.js (v18+)
*   Docker Desktop (for running PostgreSQL)

### 1. Setup & Installation
Clone this workspace and copy the environment variables:
```bash
cd gate-warroom
cp .env.example .env
```

Install workspace dependencies and compile the shared library:
```bash
npm install
npm run build --workspace=apps/shared
```

### 2. Start PostgreSQL Container
Spin up the database:
```bash
docker-compose up -d db
```

### 3. Run Migrations & Seed Syllabus
Run the Prisma migrations to initialize database tables, then seed the GATE CSE syllabus, sample achievements, and competitor demo accounts:
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development Servers
Run the full-stack system concurrently from the root directory:
```bash
npm run dev
```
*   **Frontend**: http://localhost:3000
*   **Backend REST API**: http://localhost:5000
*   **Swagger Documentation**: http://localhost:5000/api

---

## 🐳 Running with Docker

To run the entire ecosystem (Next.js, NestJS, and PostgreSQL) in containers, run:
```bash
docker-compose up --build
```
The database migrations and seeds will run automatically.
