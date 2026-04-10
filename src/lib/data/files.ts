"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPatientFiles(patientId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("patient_id", patientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function uploadFile(
  patientId: string,
  file: File,
  category: string,
  uploadedBy: string
) {
  const supabase = await createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${patientId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

  // Upload to Supabase Storage
  const { error: storageError } = await supabase.storage
    .from("patient-files")
    .upload(fileName, file);

  if (storageError) {
    return { error: storageError.message };
  }

  // Insert file record in the database
  const { data: fileRecord, error: dbError } = await supabase
    .from("files")
    .insert({
      patient_id: patientId,
      uploaded_by: uploadedBy,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: fileName,
      category,
      uploaded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (dbError) {
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from("patient-files").remove([fileName]);
    return { error: dbError.message };
  }

  revalidatePath(`/patients/${patientId}`);

  return { success: true, data: fileRecord };
}

export async function deleteFile(fileId: string) {
  const supabase = await createClient();

  // Get the file record to find the storage path
  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path, patient_id")
    .eq("id", fileId)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("patient-files")
    .remove([file.storage_path]);

  if (storageError) {
    return { error: storageError.message };
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) {
    return { error: dbError.message };
  }

  revalidatePath(`/patients/${file.patient_id}`);

  return { success: true };
}
