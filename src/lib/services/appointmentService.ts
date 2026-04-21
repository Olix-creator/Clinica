/**
 * Thin service facade over `lib/data/appointments`. Kept as a single import
 * surface so routes/actions don't have to know about the lower-level
 * Supabase query helpers. Also central place to extend with caching,
 * audit logging, or fan-out notifications later.
 */

import {
  createAppointment as dataCreate,
  getAppointmentsByRole as dataGetByRole,
  updateAppointmentStatus as dataUpdateStatus,
  lookupPatientByEmail as dataLookupPatientByEmail,
  type AppointmentStatus,
  type AppointmentWithRelations,
} from "@/lib/data/appointments";

export type { AppointmentStatus, AppointmentWithRelations };

export const appointmentService = {
  create: dataCreate,
  listForCurrentUser: dataGetByRole,
  updateStatus: dataUpdateStatus,
  lookupPatientByEmail: dataLookupPatientByEmail,
};
