export type UserRole = "doctor" | "patient";

export interface User {
  id: string;
  clerk_id?: string | null;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  specialty: string | null;
  clinic_name: string | null;
  license_number: string | null;
  is_available: boolean;
  working_days: string[] | null;
  working_hours: string | null;
  users?: User;
}

export interface Patient {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  blood_type: string | null;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  assigned_doctor_id: string | null;
  users?: User;
}

export type AppointmentStatus = "pending" | "active" | "completed" | "cancelled";
export type AppointmentType = "consultation" | "follow-up" | "initial-exam" | "lab-results" | "emergency";

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  patients?: Patient & { users?: User };
  doctors?: Doctor & { users?: User };
}

export type QueueStatus = "waiting" | "in-consultation" | "completed";

export interface QueueEntry {
  id: string;
  doctor_id: string;
  patient_id: string;
  position: number;
  room: string | null;
  status: QueueStatus;
  arrival_time: string;
  consultation_start: string | null;
  visit_type: string | null;
  patients?: Patient & { users?: User };
}

export interface Visit {
  id: string;
  appointment_id: string | null;
  doctor_id: string;
  patient_id: string;
  diagnosis: string | null;
  notes: string | null;
  vitals: {
    heart_rate?: number;
    temperature?: number;
    blood_pressure?: string;
  } | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  created_at: string;
  patients?: Patient & { users?: User };
  doctors?: Doctor & { users?: User };
}

export interface Prescription {
  id: string;
  visit_id: string | null;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  description: string | null;
  dosage_morning: string | null;
  dosage_afternoon: string | null;
  dosage_night: string | null;
  duration: string | null;
  instructions: string | null;
  is_active: boolean;
  prescribed_at: string;
  doctors?: Doctor & { users?: User };
}

export interface Task {
  id: string;
  patient_id: string;
  assigned_by: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  type: "medication" | "appointment" | "lab" | "general";
  created_at: string;
}

export interface PatientFile {
  id: string;
  patient_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  category: "lab-result" | "imaging" | "report" | "other";
  uploaded_at: string;
}
