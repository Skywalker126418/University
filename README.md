# 🎓 University Management System (UMS)

A complete, modern, and fully functional University Management System built with React, Node.js, Express, and MySQL. Designed with strong HCI (Human–Computer Interaction) principles.

## 🚀 Features

### Role-Based Access
| Role | Capabilities |
|------|-------------|
| **Student** | View dashboard, register courses, view results & timetable, update profile |
| **Lecturer** | View assigned courses, enter student marks, view timetable |
| **Admin** | Full CRUD for students, lecturers, courses, departments |
| **Registrar** | Approve/reject registrations, manage academic records |

### Key Modules
- 🔐 JWT Authentication & Role-Based Authorization
- 📊 Interactive Dashboards with Charts (Recharts)
- 📝 Course Registration with real-time feedback
- 📈 Results & GPA Calculation
- 🗓 Visual Timetable Grid
- 🔔 Notification System
- 👤 Profile Management
- 🌐 Responsive Design (Desktop, Tablet, Mobile)

## 🛠 Technology Stack

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** — utility-first styling
- **React Router v6** — client-side routing
- **Axios** — HTTP client
- **Framer Motion** — animations
- **Recharts** — data visualization
- **Lucide React** — icons

### Backend
- **Node.js** + **Express.js**
- **MySQL2** — database driver
- **JWT** — authentication
- **bcryptjs** — password hashing
- **express-validator** — input validation
- **Helmet** + **CORS** — security

### Database
- **MySQL** — `university_management_system`

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### 1. Clone / Open the Project

```bash
cd d:\PROJECTS\university
```

### 2. Database Setup

1. Open MySQL Workbench or your MySQL client
2. Run the SQL file:
```sql
SOURCE database/university_management_system.sql;
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npm run dev
```

The backend will start on **http://localhost:5000**

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**

---

## 🔑 Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@university.edu | password123 |
| Registrar | registrar@university.edu | password123 |
| Lecturer | john.doe@university.edu | password123 |
| Student | alice@student.edu | password123 |

---

## 🗂 Project Structure

```
university-management-system/
├── frontend/               # React + Vite application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── layouts/        # Layout wrappers
│       ├── hooks/          # Custom React hooks
│       ├── services/       # API service functions
│       ├── context/        # React Context providers
│       └── utils/          # Helper utilities
│
├── backend/                # Node.js + Express API
│   ├── controllers/        # Request handlers
│   ├── routes/             # API route definitions
│   ├── middleware/         # Auth, error handling
│   ├── validators/         # Input validation
│   ├── utils/              # Grade calculators etc.
│   └── server.js           # Entry point
│
├── database/               # SQL schema + seed data
│   └── university_management_system.sql
│
├── .env.example
└── README.md
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login | Public |
| GET | `/api/auth/me` | Get current user | All |
| GET | `/api/dashboard` | Role-specific dashboard | All |
| GET | `/api/students` | List students | Admin, Registrar |
| POST | `/api/students` | Create student | Admin |
| GET | `/api/courses` | List courses | All |
| POST | `/api/registrations` | Submit registration | Student |
| PUT | `/api/registrations/:id/approve` | Approve registration | Registrar |
| GET | `/api/results` | View results | Student, Lecturer |
| POST | `/api/results` | Enter results | Lecturer |
| GET | `/api/timetable` | View timetable | All |
| GET | `/api/notifications` | Get notifications | All |

---

## 🎨 HCI Principles Demonstrated

1. **Visibility** — Loading states, active navigation, system status always shown
2. **Feedback** — Toast notifications for every action, form validation errors
3. **Consistency** — Same button styles, colors, icons throughout the app
4. **Error Prevention** — Form validation before submit, confirmation dialogs before delete
5. **Error Recovery** — Clear error messages with retry options
6. **User Control** — Cancel buttons, breadcrumbs, back navigation
7. **Recognition > Recall** — Icon+text navigation, visible breadcrumbs, search
8. **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation, color + text indicators

---

## 📱 Responsive Breakpoints

- **Desktop** (1024px+): Full sidebar, multi-column layout
- **Tablet** (768px–1023px): Compact sidebar, responsive cards
- **Mobile** (<768px): Collapsible drawer, single column, touch-friendly

---

## 🔒 Security

- Passwords hashed with bcryptjs (cost factor 10)
- JWT tokens with expiry
- Protected routes with middleware
- Role-based authorization
- SQL injection prevention (parameterized queries)
- Environment variables for secrets
- CORS configured for specific origin
- Rate limiting on auth endpoints

---

## 📊 Usability Testing

See `/docs/usability-testing.md` for the 5-user usability testing results and improvement documentation.
