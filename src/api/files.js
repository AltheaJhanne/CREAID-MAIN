const API_BASE = "/api/files";

export async function savePatientFileApi(data)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files`,
      {
        method: "POST",
        headers:
        {
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify(data)
      }
    );

  return await response.json();
}

export async function getPatientFilesApi(
  patientId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${patientId}`
    );

  return await response.json();
}

export async function deletePatientFileApi(
  fileId
)
{
  const response =
    await fetch(
      `${API_BASE}/medical-files/${fileId}`,
      {
        method: "DELETE"
      }
    );

  return await response.json();
}