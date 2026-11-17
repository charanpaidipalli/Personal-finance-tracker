# Personal Finance Tracker

Full-stack student project based on the requirements:
- Angular / JavaScript frontend
- Node.js + Express.js backend
- MongoDB database
- Income Entry
- Expense Entry
- Analytics with charts and summaries
- Budget Goals
- Reports
- Runs locally with VS Code, Node.js, MongoDB and Postman

## Project structure

```text
finance-tracker-project/
├── Open Dashboard.command
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Income.js
│   │   │   ├── Expense.js
│   │   │   ├── Budget.js
│   │   │   └── Goal.js
│   │   ├── routes/
│   │   │   ├── incomeRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── budgetRoutes.js
│   │   │   ├── goalRoutes.js
│   │   │   └── reportRoutes.js
│   │   ├── db.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
    ├── src/app/
    │   ├── services/finance.service.ts
    │   ├── app.component.ts
    │   ├── app.component.html
    │   ├── app.component.css
    │   ├── app.config.ts
    │   └── app.routes.ts
    ├── src/index.html
    ├── src/main.ts
    └── package.json
└── postman/
    └── Pocketwise Finance Tracker.postman_collection.json
```

## 1. Requirements

Install:
- Node.js LTS
- VS Code
- MongoDB Community Server OR MongoDB Atlas
- Postman (for API testing)

Check Node:

```bash
node -v
npm -v
```

Check MongoDB if using local MongoDB:

```bash
mongosh
```

## 2. Backend setup

Open a terminal in `backend`:

```bash
cd backend
npm install
cp .env.example .env
npm start
```

The API runs on `http://localhost:5100`. This port avoids conflicts with common macOS services.

For local MongoDB the `.env` uses:

```env
PORT=5100
MONGO_URI=mongodb://127.0.0.1:27017/personal_finance_tracker
```

If MongoDB is not running, start it using the MongoDB service for your installation.

## 3. Open the dashboard from the project folder

On macOS, double-click `Open Dashboard.command` in Finder. It starts any missing local servers and opens Pocketwise in your default browser. Keep the Terminal window it opens running while you use the dashboard; press Control+C in that window to stop servers started by the launcher.

The launcher needs Node.js, npm, the project dependencies, and a working MongoDB connection in `backend/.env`. Opening `frontend/src/index.html` directly does not work because the Angular app needs the API and session cookies.

## 4. Frontend setup

To run the frontend manually, open another terminal:

```bash
cd frontend
npm install
npm start
```

The development server normally runs at `http://localhost:4200`. Create an account or sign in before adding entries. Login sessions use an HTTP-only cookie and finance records are scoped to the signed-in account.

## 5. Public deployment (Vercel + Render + MongoDB Atlas)

The project includes a Vercel configuration for the Angular frontend and a Render Blueprint for the Express API. The Vercel API rewrite keeps API requests and the secure session cookie on the frontend's origin.

1. Push this project to a Git provider and create a MongoDB Atlas cluster. Add the Render service's outbound IP access as required by your Atlas network access rules, and create a database user. Keep the Atlas connection string private.
2. In Vercel, import the repository, set the project Root Directory to `frontend`, and deploy. The initial API calls will not work until the Render service is configured.
3. In Render, create a Blueprint from the same repository using `render.yaml`. Set `MONGO_URI` to the Atlas connection string and `CLIENT_ORIGINS` to the exact Vercel site origin (for example, `https://your-project.vercel.app`, with no trailing slash). Keep `NODE_ENV` set to `production`.
4. Confirm the API is healthy at `https://pocketwise-finance-api.onrender.com/api/health`. If Render assigned a different service URL, update the API rewrite destination in `frontend/vercel.json` to that URL and redeploy the Vercel project.
5. Test account registration and sign-in on the Vercel URL, then confirm finance data still appears after refreshing.

The Render free instance can spin down when idle, so the first request after inactivity may be delayed. Choose an always-on paid instance in Render if the API must remain warm continuously. Vercel and Atlas availability also depend on their selected plans. Do not put database credentials in frontend files or commit them to the repository.

## 6. API endpoints

### Authentication
- POST `/api/auth/register` — create an account
- POST `/api/auth/login` — sign in
- POST `/api/auth/logout` — sign out
- GET `/api/auth/me` — check the current session

### Income
- POST `/api/income`
- GET `/api/income`
- DELETE `/api/income/:id`

### Expenses
- POST `/api/expenses`
- GET `/api/expenses`
- DELETE `/api/expenses/:id`

### Analytics
- GET `/api/analytics/summary`
- GET `/api/analytics/monthly`
- GET `/api/analytics/category`

### Budgets
- POST `/api/budgets`
- GET `/api/budgets`
- DELETE `/api/budgets/:id`

### Goals
- POST `/api/goals`
- GET `/api/goals`
- PATCH `/api/goals/:id`
- DELETE `/api/goals/:id`

### Reports
- GET `/api/reports`

## 7. Postman collection

Import [`postman/Pocketwise Finance Tracker.postman_collection.json`](./postman/Pocketwise%20Finance%20Tracker.postman_collection.json) into Postman. Set the collection variables `name`, `email`, and `password`, run **Register account** once for a new email, then run **Login** and the remaining requests. Postman stores the session cookie automatically. The collection covers income, expenses, analytics, budget goals, reports, and logout.

## 8. Postman examples

First register or log in using the `/api/auth/register` or `/api/auth/login` endpoint. Keep the session cookie for later requests.

POST `http://localhost:5100/api/income`

```json
{
  "source": "Part-time job",
  "amount": 15000,
  "date": "2026-11-17",
  "description": "November income"
}
```

POST `http://localhost:5100/api/expenses`

```json
{
  "category": "Food",
  "amount": 500,
  "date": "2026-11-17",
  "description": "Lunch"
}
```

POST `http://localhost:5100/api/budgets`

```json
{
  "category": "Food",
  "limit": 5000,
  "month": "2026-11"
}
```

POST `http://localhost:5100/api/goals`

```json
{
  "name": "Emergency Fund",
  "targetAmount": 50000,
  "currentAmount": 10000,
  "deadline": "2027-06-30"
}
```

## 9. Student demo flow

1. Start MongoDB.
2. Double-click `Open Dashboard.command` in the project folder.
3. Create an account or sign in.
4. Add income and expenses.
5. Add a budget and savings goal.
6. Open Analytics to see totals and charts.
7. Open Reports to see your financial report.
8. Use Postman to demonstrate the authenticated REST API.
