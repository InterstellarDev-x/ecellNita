(## Campus_Recycle — Local setup guide

This document explains how to run the Campus_Recycle project locally in two ways:

- Using Docker Compose (recommended for a faithful environment)
- Running frontend and backend separately (traditional local development)

All commands below are written for Windows PowerShell (the default shell for this workspace). If you use a different shell adjust commands accordingly.

## Quick facts (ports and endpoints)

- Frontend (development): http://localhost:3000
- Backend (API): http://localhost:4000
- Backend API root: http://localhost:4000/api/v1
- MongoDB (container): 27017


## 1) Run with Docker Compose (recommended)

Prerequisites

- Docker Desktop installed and running
- At least ~1.5 GB free disk + network access

Files used by compose

- docker-compose.yml (at repository root)
- backend/.env (populated by you)
- frontend/.env (optional — used by frontend build args)

Steps

1. From repository root (d:\campus_recyle) open PowerShell.
2. Build and start everything:

```powershell
docker-compose up --build
```

Or to run in background (detached):

```powershell
docker-compose up --build -d
```

3. Wait until services are healthy. The compose file starts three services: mongodb (image: mongo), backend (build: ./backend) and frontend (build: ./frontend). The frontend build is passed a build-arg REACT_APP_BASE_URL which defaults to http://localhost:4000/api/v1 in the compose file.

4. Visit the frontend at http://localhost:3000. The backend will be available at http://localhost:4000.

Stop and remove containers + volumes

```powershell
docker-compose down -v
```

Notes about Docker & environment variables

- The compose file maps `./backend/.env` into the backend container. Create that file before `docker-compose up` so the backend container has required settings.
- If you need to change the API URL used by the frontend at build-time, adjust the `REACT_APP_BASE_URL` build-arg inside docker-compose.yml or set an appropriate `.env` in `frontend/` and rebuild.


## 2) Run frontend and backend separately (traditional local development)

This is useful for active development (hot reloading).

Prerequisites

- Node.js 18+ (recommended for dependencies in package.json)
- npm (comes with Node)
- (Optional) MongoDB running locally OR use the Docker MongoDB container described in section 1


Backend (API)

1. Open PowerShell and go to the backend folder:

```powershell
cd d:\campus_recyle\backend
```

2. Install dependencies (only once):

```powershell
npm install
```

3. Create a `.env` file inside `backend/` with the required variables. Example `.env` (adjust values):

```env
# backend/.env
PORT=4000

# MongoDB connection string (example of hosted cluster or local instance)
MONGODB_URL=mongodb://localhost:27017/campus_recycle_db

# Cloudinary (image uploads)
CLOUD_NAME=your_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
FOLDER_NAME=nitaspace

# Mail sender (for nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_USER=your@email.com
MAIL_PASS=your-email-password-or-app-password

# JWT secret
JWT_SECRET=change_this_to_a_strong_secret

# Optional: Host (printed by server)
HOST=http://localhost:4000

# Optional: upload temp dir (if you hit issues on Windows)
# UPLOAD_TMP_DIR=C:\\Temp\\uploads
```

Notes: replace MONGODB_URL with your MongoDB Atlas connection string or a local mongodb URI. If you run MongoDB in Docker (see section 1), you can point to mongodb://localhost:27017.

4. Start the backend in development mode (watching with nodemon):

```powershell
npm run dev
```

Or start normally:

```powershell
npm start
```

You should see logs including "server is running at port 4000" and a printed `Frontend URL:` line (this uses process.env.HOST if set).


Frontend (React)

1. In a new PowerShell window, go to the frontend folder:

```powershell
cd d:\campus_recyle\frontend
```

2. Install dependencies (only once):

```powershell
npm install
```

3. Create a `.env` file in `frontend/` if you want to override the API base URL used during development. Example `frontend/.env`:

```env
# frontend/.env
REACT_APP_BASE_URL=http://localhost:4000/api/v1
```

4. Start the React dev server (hot reload):

```powershell
npm start
```

This runs the app at http://localhost:3000. The frontend code references `REACT_APP_BASE_URL` to call the backend API.


## 3) Verification / smoke tests

After starting either with Docker or locally, verify:

- Backend root: Open http://localhost:4000/ — should return a JSON response indicating the server is up.
- Frontend: Open http://localhost:3000/ and navigate the UI.
- API endpoints: Try any API endpoint, e.g. GET http://localhost:4000/api/v1/category (or other endpoints in routes/) with an HTTP client like Postman or your browser.


## 4) Common problems & troubleshooting

- "ECONNREFUSED" connecting to MongoDB
	- Ensure MongoDB is running. If using Docker Compose, run `docker-compose up mongodb` or run full compose. If using a hosted cluster, verify `MONGODB_URL`.

- Uploads or temp file errors on Windows
	- The backend currently uses express-fileupload with a tempFileDir of `/tmp/` in the code. On Windows that can be problematic. If you see temp path errors, either run backend in Docker (Linux path), or set an environment specific temp dir (for example set UPLOAD_TMP_DIR and modify the backend fileupload config to read it). As a quick workaround run your backend in Docker.

- Port already in use (3000 or 4000)
	- Stop the process using the port or change the PORT (backend) or the React dev port via environment variable.

- Email sending (nodemailer) fails
	- For Gmail, you usually need an App Password if 2FA is enabled, and set MAIL_HOST, MAIL_USER, MAIL_PASS accordingly.


## 5) Helpful commands summary (PowerShell)

- Start everything with Docker Compose (foreground):

```powershell
docker-compose up --build
```

- Start everything with Docker Compose (detached):

```powershell
docker-compose up --build -d
```

- Stop and remove containers and volumes:

```powershell
docker-compose down -v
```

- Run backend locally:

```powershell
cd d:\\campus_recyle\\backend; npm install; npm run dev
```

- Run frontend locally:

```powershell
cd d:\\campus_recyle\\frontend; npm install; npm start
```


## 6) Development tips and quality gates

- Node & npm: Use Node.js 18+ when installing dependencies and running the frontend.
- Lint / Tests: The repo includes React test setup. Run `npm test` inside `frontend/` to run tests defined there.
- When making changes to environment-sensitive code (DB connection, cloudinary), a quick smoke test is: start backend then run `curl http://localhost:4000/` or open it in the browser.


## 7) Next steps / optional improvements

- Add example `.env.example` files in `backend/` and `frontend/` with required variables (safe to commit).
- Make fileupload temp directory configurable from `.env` so running on Windows works without a container.
- Add a `Makefile` or PowerShell scripts for common commands (start-dev, stop, build).


If you want, I can create `backend/.env.example` and `frontend/.env.example` files, and optionally adjust the backend fileupload configuration to read a configurable temp folder so Windows hosts are supported without Docker.

