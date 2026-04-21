/**
 * Service facade for clinic membership operations. UI + server actions
 * should import from here, not from lib/data directly, so that we can
 * layer in audit logs / email notifications later without touching pages.
 */

import {
  listClinicMembers as dataList,
  listClinicsForUser as dataListForUser,
  listOwnedClinics as dataListOwned,
  findProfileByEmail as dataFind,
  inviteClinicMember as dataInvite,
  removeClinicMember as dataRemove,
  type ClinicMember,
  type ClinicMemberRole,
  type ClinicMemberWithProfile,
} from "@/lib/data/clinicMembers";

export type { ClinicMember, ClinicMemberRole, ClinicMemberWithProfile };

export const clinicMemberService = {
  list: dataList,
  listClinicsForUser: dataListForUser,
  listOwnedClinics: dataListOwned,
  findByEmail: dataFind,
  invite: dataInvite,
  remove: dataRemove,
};
