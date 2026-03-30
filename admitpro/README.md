# AdmitManage 🎓

A modern admission management system built with React and Supabase. Designed to streamline the admission process with role-based access for Admins, Admission Officers, and Management.

🔗 **Live Demo:** [admitmanage.vercel.app](https://admitmanage-45ef-elyd29iec-ideeshs-projects.vercel.app/)

---

## 🚀 Features

- 🔐 **Role-based Login** — Separate access for Admin, Admission Officer, and Management
- 📋 **Admission Management** — Manage and track student applications end-to-end
- 👤 **Applicant Tracking** — View and update applicant details and status
- 📊 **Admin Dashboard** — Overview of admissions, allocations, and user activity
- 🏫 **Allocations** — Assign applicants to programs or seats
- 🛡️ **Secure Authentication** — Powered by Supabase Auth

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [React](https://react.dev/) | Frontend UI |
| [Vite](https://vitejs.dev/) | Build tool & dev server |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Supabase](https://supabase.com/) | Database & Authentication |

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — manage users, applicants, allocations |
| **Admission Officer** | Manage and process applicant applications |
| **Management** | View dashboards and reports |

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- A [Supabase](https://supabase.com/) account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ideesh/admitmanage.git
   cd admitmanage
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root of the project:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these in your Supabase project under **Settings → API**.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Setup

This project uses Supabase as the backend. The main table is:

### `user_profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Matches Supabase Auth user ID |
| `email` | text | User email |
| `role` | text | Admin / Admission Officer / Management |
| `full_name` | text | Display name |
| `created_at` | text | Account creation date |

---

## 📁 Project Structure

```
admitmanage/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── App.jsx
│   └── main.jsx
├── .env
├── index.html
├── package.json
└── vite.config.js
```

---

## 📄 License

This project is for educational and internal use.

---

> Built with ❤️ using React + Supabase
