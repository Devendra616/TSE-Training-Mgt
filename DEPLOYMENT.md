# Deployment Guide

This guide describes how to deploy the TSE Training Management System to a server using Docker Compose.

## Prerequisites

1.  **Docker**: Ensure Docker is installed on your server.
    - [Install Docker Engine](https://docs.docker.com/engine/install/)
2.  **Docker Compose**: Ensure Docker Compose is installed.
    - Included with Docker Desktop and recent Docker Engine versions (`docker compose`).
    - Or [Install Docker Compose independently](https://docs.docker.com/compose/install/).

## Deployment Steps

### 1. Transfer Files

Copy the project files to your server. You can use `scp`, `rsync`, or clone from a git repository.

Required files/directories:
- `docker-compose.yml`
- `nginx.conf`
- `backend/` (Directory)
- `frontend/` (Directory)
- `.env` (Create this file based on `.env.example`)

### 2. Configure Environment Variables

Create a `.env` file in the root directory.

```bash
# Copy example env
cp .env.example .env
```

Edit `.env` and set secure values for production:

```ini
# Database
POSTGRES_USER=your_secure_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=training_mgt
DB_NAME=training_mgt
DB_USER=your_secure_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_long_secure_random_string

# URLs
# For Nginx (Best for Production): /api
# For Direct Access: http://your-server-ip:3000
VITE_API_URL=/api
```

### 3. Build and Run (Production Mode with Nginx)

This is the recommended way to deploy. It puts Nginx in front of both Frontend and Backend, serving everything on port 80.

1.  Ensure `VITE_API_URL=/api` in your `.env` file.
2.  Run with the production profile:

```bash
docker-compose --profile production up -d --build
```

- `-d`: Detached mode.
- `--profile production`: Enables the Nginx service.

**Access**: `http://<your-server-ip>`

### Alternative: Build and Run (Direct Access)

If you do NOT want to use Nginx:

1.  Set `VITE_API_URL=http://<your-server-ip>:3000` in your `.env`.
2.  Run without the profile:

```bash
docker-compose up -d --build
```

**Access**:
- Frontend: `http://<your-server-ip>:5173`
- Backend: `http://<your-server-ip>:3000`

### 4. Verify Deployment

Check status:

```bash
docker-compose ps
```

You should see `postgres`, `redis`, `backend`, `frontend`, and `nginx` (if profile used).

## Common Issues

### Frontend API Errors
- If using Nginx, ensure `VITE_API_URL=/api`.
- If using Direct Access, ensure `VITE_API_URL` is the full public URL of the backend.
- **Note**: Modifying `VITE_API_URL` requires a rebuild (`docker-compose ... up -d --build`).

### Database Connectivity
- `DB_HOST` is forced to `postgres` in `docker-compose.yml`. This is correct. Do not change it to `localhost` in the compose file.

### Logs
```bash
docker-compose logs -f
```
