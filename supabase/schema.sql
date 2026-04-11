-- ============================================
-- CLINICA - Database Schema (Clerk Auth)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users table (linked to Clerk via clerk_id)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('doctor', 'patient', 'receptionist', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialty TEXT,
  clinic_name TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT true,
  working_days TEXT[],
  working_hours TEXT
);

-- 3. Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT,
  blood_type TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  assigned_doctor_id UUID REFERENCES public.doctors(id)
);

-- 4. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  type TEXT CHECK (type IN ('consultation', 'follow-up', 'initial-exam', 'lab-results', 'emergency')) DEFAULT 'consultation',
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Queue table
CREATE TABLE public.queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  position INT NOT NULL,
  room TEXT,
  status TEXT CHECK (status IN ('waiting', 'in-consultation', 'completed')) DEFAULT 'waiting',
  arrival_time TIMESTAMPTZ DEFAULT now(),
  consultation_start TIMESTAMPTZ,
  visit_type TEXT
);

-- 6. Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  diagnosis TEXT,
  notes TEXT,
  vitals JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in-progress',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES public.visits(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id),
  medication_name TEXT NOT NULL,
  description TEXT,
  dosage_morning TEXT,
  dosage_afternoon TEXT,
  dosage_night TEXT,
  duration TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  prescribed_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  assigned_by UUID NOT NULL REFERENCES public.doctors(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  type TEXT CHECK (type IN ('medication', 'appointment', 'lab', 'general')) DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INT,
  storage_path TEXT NOT NULL,
  category TEXT CHECK (category IN ('lab-result', 'imaging', 'report', 'other')) DEFAULT 'other',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- IMPORTANT: Disable RLS for Clerk-based auth
-- Since we're using Clerk (not Supabase Auth),
-- RLS policies using auth.uid() won't work.
-- Access control is handled at the application level.
-- ============================================

-- If you want RLS, you'd need to use a service_role key
-- and implement custom JWT verification. For now, we
-- keep RLS disabled for the anon key to work with Clerk.

-- ============================================
-- Enable Realtime for Queue
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue;

-- ============================================
-- Storage Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('clinical-files', 'clinical-files', false);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_queue_doctor ON public.queue(doctor_id);
CREATE INDEX idx_visits_doctor ON public.visits(doctor_id);
CREATE INDEX idx_visits_patient ON public.visits(patient_id);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_tasks_patient ON public.tasks(patient_id);
