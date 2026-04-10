# Clinica - Medical Portal

A full-stack medical clinic SaaS application for managing appointments, patient queues, medical history, prescriptions, and patient tasks.

## Tech Stack

- **Frontend:** Next.js 16 (App Router) + React 19
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (Auth, Database, Realtime, Storage)
- **Language:** TypeScript
- **Hosting:** Vercel

## Features

- **Doctor Dashboard** - Overview of daily patients, queue status, appointments
- **Patient Management** - Full patient profiles with medical history, vitals, files
- **Real-time Queue** - Live patient queue with Supabase Realtime
- **Prescriptions** - Create and manage prescriptions with dosage tracking (morning/afternoon/night)
- **Appointments** - Schedule and manage appointments
- **Patient Tasks** - Assign tasks to patients (medication, labs, follow-ups)
- **File Management** - Upload and manage clinical files (PDF, images)
- **Patient Portal** - Patients can view their own data, appointments, and tasks
- **Multi-language** - English and French support
- **Responsive** - Works on desktop and mobile

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script
4. This creates all tables, RLS policies, storage buckets, and triggers

### 3. Enable Realtime

1. Go to **Database > Replication** in Supabase dashboard
2. Enable realtime for the `queue` table

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL (Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key (Settings > API)

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Create Test Users

1. Go to your Supabase dashboard > Authentication > Users
2. Create a doctor account:
   - Email: `doctor@clinica.med`
   - Password: `password123`
   - User metadata: `{"role": "doctor", "full_name": "Dr. Julian Moore"}`
3. Create a patient account:
   - Email: `patient@clinica.med`
   - Password: `password123`
   - User metadata: `{"role": "patient", "full_name": "Eleanor Shellstrop"}`

The `handle_new_user` trigger will automatically create the corresponding profile entries.

## Deploy on Vercel

1. Push your code to a Git repository
2. Import the project on [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

## Project Structure

```
src/
  app/
    login/              # Login page
    doctor/             # Doctor portal
      dashboard/        # Main dashboard
      appointments/     # Appointment management
      patients/         # Patient list & profiles
      queue/            # Real-time patient queue
      history/          # Visit history
      settings/         # Doctor settings
    patient/            # Patient portal
      dashboard/        # Patient dashboard
      appointments/     # View appointments
      tasks/            # Task list
      history/          # Visit history
  components/
    auth/               # Login form components
    layout/             # Sidebar, TopBar, LanguageSwitcher
    ui/                 # Reusable UI components
    dashboard/          # Dashboard-specific components
    patients/           # Patient components
    appointments/       # Appointment components
    queue/              # Queue components
    prescriptions/      # Prescription components
    history/            # History components
    patient/            # Patient portal components
    settings/           # Settings components
  lib/
    supabase/           # Supabase client setup
    auth/               # Auth server actions
    data/               # Data fetching & mutations
    i18n/               # Internationalization (EN/FR)
  types/                # TypeScript types
```

## Roles

- **Doctor** - Full CRUD access to patients, appointments, queue, prescriptions, files
- **Patient** - Read-only access to their own data, can mark tasks as done
