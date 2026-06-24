files.js
import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const fileRoutes =
new Elysia({
  prefix: "/files"
})

.post(
"/medical-files",
async ({ body, set }) =>
{
  console.log(
  "BODY:",
  body
);
  const {
  patient_id,
  file_name,
  storage_path,
  file_type,
  mime_type,
  size_bytes,
  taken_at
} = body;

const {
  data,
  error
} = await supabase
  .from("medical_files")
  .insert([
   {
  patient_id,
  uploaded_by: patient_id,
  file_type,
  title: file_name,
  notes: "",
  taken_at:
    taken_at.split("T")[0],
  file_name,
  storage_path,
  file_url: "",
  mime_type,
  size_bytes
}
  ])
  .select()
  .single();

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    file: data
  };
  console.log(
  "INSERT ERROR:",
  error
);
})

.delete("/medical-files/:fileId",
async ({ params, set }) =>
{
  const { data, error } =
    await supabase
      .from("medical_files")
      .select("*")
      .eq("id", params.fileId)
      .single();

  if(error)
  {
    set.status = 404;

    return {
      success: false
    };
  }

  const filePath =
  data.storage_path;

  await supabase.storage
  .from("medical-files")
  .remove([filePath]);

  await supabase
    .from("medical_files")
    .delete()
    .eq("id", params.fileId);

  return {
    success: true
  };
})

.get("/medical-files/:patientId",
async ({ params, set }) =>
{
  const {
    data,
    error
  } =
  await supabase
    .from("medical_files")
    .select("*")
    .eq(
      "patient_id",
      params.patientId
    );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  const files = await Promise.all(
  (data || []).map(
    async (file) =>
    {
      let fileUrl = file.file_url;

if(
  file.storage_path &&
  file.storage_path.includes("/")
)
{
  const {
    data: signedData
  } =
  await supabase.storage
    .from("medical-files")
    .createSignedUrl(
      file.storage_path,
      60 * 60
    );

  if(signedData)
  {
    fileUrl =
      signedData.signedUrl;
  }
}

      return {
        ...file,
        file_url: fileUrl
      };
    }
  )
);
    console.log(
  "FILES SENT:",
  files
);

  return {
    success: true,
    files
  };
})