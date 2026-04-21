import {
  listClinics as dataListClinics,
  createClinic as dataCreateClinic,
} from "@/lib/data/clinics";
import {
  listDoctorsByClinic as dataListDoctors,
  listAllDoctors as dataListAllDoctors,
  getDoctorByProfile as dataGetDoctorByProfile,
  addDoctorToClinic as dataAddDoctor,
} from "@/lib/data/doctors";

export const clinicService = {
  listClinics: dataListClinics,
  createClinic: dataCreateClinic,
  listDoctorsByClinic: dataListDoctors,
  listAllDoctors: dataListAllDoctors,
  getDoctorByProfile: dataGetDoctorByProfile,
  addDoctorToClinic: dataAddDoctor,
};
