# Training Management System

A full-stack web application for managing employee training compliance in mining organizations. Built with React, Node.js, PostgreSQL, and Redis.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-18+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## 🎯 Features

### Core Functionality
- **Employee Management** - Full CRUD with photo upload, SAP ID, designations
- **Training Master** - Define training types with validity periods and mandatory flags
- **Batch Scheduling** - Create training batches with capacity, dates, venue, instructor
- **Attendance Tracking** - Interactive matrix for daily attendance marking
- **Certificate Workflow** - Draft → Submit → Approve/Reject with PDF generation
- **Compliance Dashboard** - Real-time status indicators (🟢🟡🔴)

### Additional Features
- **Migration Tool** - Digitize legacy paper certificates with duplicate detection
- **Calendar View** - Monthly grid visualization of all batches
- **Reports & Export** - Employee history, batch reports, CSV export
- **Notifications** - In-app notification system with unread counts
- **Theme Toggle** - Light/Dark/System theme preferences

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Auth | JWT with HTTP-only cookies |
| PDF | Puppeteer |
| File Upload | Multer |
| Container | Docker & Docker Compose |

## 📁 Project Structure

```
TSE-Training Mgt/
├── backend/
│   ├── src/
│   │   ├── config/         # Database, Redis, app config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, upload
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (PDF, compliance)
│   │   └── utils/          # Errors, logger, helpers
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Quick Start

1. **Clone and navigate**
   ```bash
   cd TSE-Training\ Mgt
   ```

2. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

4. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your settings
   ```

5. **Seed database**
   ```bash
   cd backend && npm run db:seed
   ```

6. **Start development servers**
   ```bash
   # Terminal 1 - Backend (port 3000)
   cd backend && npm run dev
   
   # Terminal 2 - Frontend (port 5173)
   cd frontend && npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000/api

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Training Officer | officer@example.com | officer123 |
| Mines Manager | manager@example.com | manager123 |

## 📚 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout and clear cookie |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List with search/pagination |
| GET | `/api/employees/:id` | Get by ID |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| POST | `/api/employees/:id/photo` | Upload photo |

### Trainings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trainings` | List all trainings |
| GET | `/api/trainings/:id` | Get by ID |
| POST | `/api/trainings` | Create training |
| PUT | `/api/trainings/:id` | Update training |
| DELETE | `/api/trainings/:id` | Delete training |

### Batches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/batches` | List with filters |
| GET | `/api/batches/:id` | Get batch details |
| POST | `/api/batches` | Create batch |
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch |
| POST | `/api/batches/:id/clone` | Clone batch |
| POST | `/api/batches/:id/enroll` | Enroll employees |
| DELETE | `/api/batches/:id/enroll/:empId` | Remove employee |
| GET | `/api/batches/:id/attendance` | Get attendance matrix |
| POST | `/api/batches/:id/attendance` | Mark single attendance |
| POST | `/api/batches/:id/attendance/bulk` | Bulk mark attendance |

### Certificates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/certificates` | List with status filter |
| GET | `/api/certificates/pending` | Pending approvals |
| POST | `/api/certificates/generate` | Generate drafts from batch |
| PUT | `/api/certificates/:id/submit` | Submit for approval |
| POST | `/api/certificates/submit-bulk` | Bulk submit |
| PUT | `/api/certificates/:id/approve` | Approve certificate |
| POST | `/api/certificates/approve-bulk` | Bulk approve |
| PUT | `/api/certificates/:id/reject` | Reject with reason |
| PUT | `/api/certificates/:id/resubmit` | Resubmit rejected |
| GET | `/api/certificates/:id/pdf` | Download PDF |
| GET | `/api/certificates/employee/:id` | Employee history |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Overview stats |
| GET | `/api/dashboard/compliance` | Compliance details |
| GET | `/api/dashboard/by-department` | Stats by department |
| GET | `/api/dashboard/by-training` | Stats by training |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/employee/:id` | Employee training report |
| GET | `/api/reports/batch/:id` | Batch report |
| GET | `/api/reports/training/:id` | Training summary |
| GET | `/api/reports/department/:id` | Department compliance |
| GET | `/api/reports/export/certificates` | CSV export |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### Migration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/migration/upload` | Upload PDF/image |
| POST | `/api/migration/check-duplicate` | Check for duplicates |
| POST | `/api/migration/certificate` | Migrate single cert |
| POST | `/api/migration/bulk` | Bulk migrate |
| GET | `/api/migration/stats` | Migration statistics |

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Training Officer** | Manage batches, attendance, submit certificates, migration |
| **Mines Manager** | View all, approve/reject certificates |

## 🔐 Security Features

- JWT authentication with HTTP-only cookies
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation with express-validator
- Password hashing with bcrypt
- CORS configuration

## 🎨 UI Features

- Responsive design (mobile-friendly)
- Dark/Light/System theme toggle
- Loading states and animations
- Toast notifications
- Modal dialogs
- Data tables with pagination
- Search and filter functionality

## 📦 Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Compliance
COMPLIANCE_WARNING_DAYS=30
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose build

# Reset database
docker-compose down -v
docker-compose up -d
```

## 📝 Database Models

- **User** - System users with roles
- **Department** - Organizational units
- **Employee** - Employee records with SAP ID
- **Training** - Training type definitions
- **Batch** - Training sessions
- **BatchEmployee** - Enrollment junction table
- **Attendance** - Daily attendance records
- **Certificate** - Training certificates with workflow
- **CertSequence** - Auto-increment certificate numbers
- **Notification** - In-app notifications

## 🔄 Certificate Workflow

```
┌─────────┐     ┌─────────────────┐     ┌──────────┐
│  DRAFT  │ ──► │ PENDING_APPROVAL│ ──► │ APPROVED │
└─────────┘     └─────────────────┘     └──────────┘
                        │
                        ▼
                  ┌──────────┐
                  │ REJECTED │ ──► RESUBMIT ──►
                  └──────────┘
```

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## 📈 Future Enhancements

- [ ] Email notifications for due dates
- [ ] Cron jobs for daily compliance checks
- [ ] Database backup automation
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and charts
- [ ] Audit logging

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for Mining PSU Training Management
