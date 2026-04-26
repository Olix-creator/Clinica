"use client";

import { ClinicMapView } from "@/components/public/ClinicMapView";

export function ClinicLocationMap({
  clinicId,
  clinicName,
  latitude,
  longitude,
  city,
  specialty,
}: {
  clinicId: string;
  clinicName: string;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  specialty: string | null;
}) {
  return (
    <ClinicMapView
      clinics={[
        {
          id: clinicId,
          name: clinicName,
          city,
          specialty,
          latitude,
          longitude,
        },
      ]}
      focusLat={latitude ?? undefined}
      focusLon={longitude ?? undefined}
    />
  );
}
