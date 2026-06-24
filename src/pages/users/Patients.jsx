import { supabase } from "../../lib/supabase";
import { useState, useRef, useEffect } from "react";
import "../../styles/patients.css";
import { getPatientsApi } from "../../api/patients";
import { getPatientLastVisitApi } from "../../api/appointments";
import { savePatientFileApi, getPatientFilesApi, deletePatientFileApi } from "../../api/files";


function calculateAge(birthdate)
{
  if(!birthdate)
  {
    return "";
  }

  const today =
    new Date();

  const birth =
    new Date(birthdate);

  let age =
    today.getFullYear() -
    birth.getFullYear();

  const monthDiff =
    today.getMonth() -
    birth.getMonth();

  if(
    monthDiff < 0 ||
    (
      monthDiff === 0 &&
      today.getDate() <
      birth.getDate()
    )
  )
  {
    age--;
  }

  return age;
}
const FILE_ICON =
{
  xray: "🦷",
  lab: "🧪",
  clearance: "🏥",
  consent: "✍️",
  other: "📎"
};

function Patients() 
{
  const [patients, setPatients] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);
  const [selected, setSelected]           = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [lastVisit, setLastVisit] = useState("No visits yet");
  const [selectedFileType, setSelectedFileType] = useState("other");
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [showAddModal, setShowAddModal]   = useState(false);
  const [dragOver, setDragOver]           = useState(false);
  const [activeTab, setActiveTab]         = useState("info");
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [newForm, setNewForm]             = useState({ name: "", age: "", contact: "", email: "", dentist: "Dr. Vannesa Cruz" });

  const fileInputRef = useRef();

  useEffect(() =>
{
  loadPatients();
}, []);


async function deleteRecord(
  fileId
)
{
  try
  {
    await deletePatientFileApi(
      fileId
    );

    loadPatientFiles(
      selectedPatient.id
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

async function loadPatients()
{
  try
  {
    const response =
      await getPatientsApi();

    console.log(
      "RAW RESPONSE:",
      response
    );

    console.log(
      "RESPONSE PATIENTS:",
      response.patients?.length
    );

    setPatients(
      response.patients || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}
async function loadLastVisit(
  patientId
)
{
  try
  {
    const response =
      await getPatientLastVisitApi(
        patientId
      );

    setLastVisit(
      response.lastVisit ||
      "No visits yet"
    );
  }
  catch(error)
  {
    console.error(error);

    setLastVisit(
      "No visits yet"
    );
  }
}
  const filtered = patients.filter((p) =>
{
  const fullName =
    `${p.first_name || ""}
     ${p.last_name || ""}`
      .toLowerCase();

  const matchSearch =
    fullName.includes(
      (search || "").toLowerCase()
    );

  const matchStatus =
    filterStatus === "All"
      ? true
      : filterStatus === "Active"
        ? !p.is_archived
        : p.is_archived;

  return matchSearch && matchStatus;
});

  const selectedPatient = selected ? patients.find((p) => p.id === selected) : null;


useEffect(() =>
{
  if(
    selectedPatient &&
    !selectedPatient.is_guest
  )
  {
    loadPatientFiles(
      selectedPatient.id
    );
  }
  else
  {
    setPatientFiles([]);
  }
},
[selectedPatient]);

  
async function handleFileUpload(
  files,
  patientId
)
{
  if(
    !files ||
    files.length === 0
  )
  {
    return;
  }

  try
  {
    for(const file of files)
    {
      const filePath =
        `${patientId}/${
          Date.now()
        }-${file.name}`;

      const {
        error: uploadError
      } =
      await supabase.storage
        .from(
          "medical-files"
        )
        .upload(
          filePath,
          file
        );

      if(uploadError)
      {
        throw uploadError;
      }

      const {
        data
      } =
      supabase.storage
        .from(
          "medical-files"
        )
        .getPublicUrl(
          filePath
        );

      await savePatientFileApi({
  patient_id: patientId,
  file_name: file.name,
  storage_path: filePath,
  mime_type: file.type,
  size_bytes: file.size,
  taken_at: new Date().toISOString(),
  file_type: selectedFileType
});
    }

    loadPatientFiles(
      patientId
    );
  }
  catch(error)
  {
    console.error(
      error
    );
  }
}

async function loadPatientFiles(
  patientId
)
{
  try
  {
    const response =
      await getPatientFilesApi(
        patientId
      );

    const records =
(response.files || [])
.map(file => ({
  id: file.id,
  name: file.file_name,
  file_name: file.file_name,
  file_url: file.file_url,
  mime_type: file.mime_type,
  type: file.file_type,
  date: file.created_at?.split("T")[0],
  size:
    file.size_bytes
      ? `${Math.round(file.size_bytes / 1024)} KB`
      : ""
}));

    console.log(
      "RECORDS:",
      records
    );

    setPatientFiles(
      records
    );
  }
  catch(error)
  {
    console.error(error);

    setPatientFiles([]);
  }
}

  function handleDrop(e, patientId) 
  {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files, patientId);
  }

  function handleNotesChange(e) 
  {
    const val = e.target.value;
    setPatients((prev) =>
        prev.map((p) => (p.id === selectedPatient.id ? { ...p, notes: val } : p))
    );
  }

  function handleAddPatient() 
  {
    if (!newForm.name.trim() || !newForm.age) return;
    const newP = 
    {
      id:              Date.now(),
      name:            newForm.name,
      age:             Number(newForm.age),
      contact:         newForm.contact,
      email:           newForm.email,
      lastVisit:       new Date().toISOString().split("T")[0],
      assignedDentist: newForm.dentist,
      status:          "Active",
      avatar:          newForm.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      records:         [],
      notes:           "",
    };
    setPatients((prev) => [newP, ...prev]);
    setSelected(newP.id);
    setActiveTab("info");
    setShowAddModal(false);
    setNewForm({ name: "", age: "", contact: "", email: "", dentist: "Dr. Vannesa Cruz" });
  }

async function handleSelectPatient(patientId)
{
  setSelected(patientId);

  const patient =
    patients.find(
      p => p.id === patientId
    );

  if(!patient)
  {
    return;
  }

  /* GUEST PATIENT */
  if(patient.is_guest)
  {
    setPatientFiles([]);
    setLastVisit("Guest Appointment");
    return;
  }

  /* REGISTERED PATIENT */
  loadPatientFiles(patient.id);
  loadLastVisit(patient.id);
}

  return (
    <div className="patients-root">

      <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle patient list">
        {sidebarOpen ? "✕" : "🦷 Patients"}
      </button>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`patients-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <span className="title-icon">🦷</span> Patients
          </h1>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>+ New Patient</button>
        </div>

        <div className="sidebar-filters">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input className="search-input" placeholder="Search name or dentist…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="filter-pills">
            {["All", "Active", "Inactive"].map((s) => (
              <button key={s} className={`pill ${filterStatus === s ? "pill-active" : ""}`} onClick={() => setFilterStatus(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <ul className="patient-list">
            {filtered.map((p) => (
                <li key={p.id} className={`patient-item ${selected === p.id ? "patient-item-selected" : ""}`} onClick={() => handleSelectPatient(p.id)}>
                    <div className="patient-avatar">
  {
    p.avatar_url ? (
      <img
        src={p.avatar_url}
        alt={`${p.first_name} ${p.last_name}`}
        className="patient-avatar-img"
        onError={(e) =>
        {
          e.currentTarget.src =
            "/default-avatar.png";
        }}
      />
    ) : (
      <>
        {(p.first_name?.[0] || "")}
        {(p.last_name?.[0] || "")}
      </>
    )
  }
</div>
                    <div className="patient-meta">
                        <span className="patient-name">{p.first_name} {" "} {p.last_name}</span>
                        <span className="patient-sub">{p.email}</span>
                    </div>
                    {
  p.is_guest
  ? (
      <span className="guest-badge">
        Guest
      </span>
    )
  : (
      <span
        className={`status-badge ${
          p.is_archived
            ? "status-inactive"
            : "status-active"
        }`}
      >
        {
          p.is_archived
            ? "Inactive"
            : "Active"
        }
      </span>
    )
}
                </li>
            ))}
            {filtered.length === 0 && <li className="empty-list">No patients found.</li>}
        </ul>
      </aside>

      <main className="patients-detail">
        {!selectedPatient ? (
          <div className="detail-empty">
            <div className="empty-icon">🦷</div>
            <p>Select a patient to view their profile</p>
          </div>
        ) : (
          <div className="detail-content">
            <div className="detail-hero">
              <div className="detail-avatar">
{
  selectedPatient.avatar_url ? (
    <img
      src={selectedPatient.avatar_url}
      alt={selectedPatient.full_name}
      className="detail-avatar-img"
    />
  ) : (
    <>
      {(selectedPatient.first_name?.[0] || "")}
      {(selectedPatient.last_name?.[0] || "")}
    </>
  )
}
</div>
              <div className="detail-hero-info">
                <h2 className="detail-name">{selectedPatient.first_name} {" "} {selectedPatient.last_name}</h2>
                <p className="detail-sub">Age {calculateAge(selectedPatient.birthdate)} · {selectedPatient.contact_number}</p>
                <p className="detail-sub">{selectedPatient.email}</p>
              </div>

              <div className="detail-hero-meta">
                <span className={`status-badge-lg ${selectedPatient.is_archived === false ? "status-active" : "status-inactive"}`}>
                  {selectedPatient.is_archived ? "Inactive" : "Active"}
                </span>
                <p className="last-visit">Last Visit: {selectedPatient.is_guest ? "Guest Patient" : lastVisit || "-"}</p>
              </div>
            </div>

            <div className="detail-tabs">
              {["info", "records", "notes"].map((tab) => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? "tab-active" : ""}`} onClick={() => setActiveTab(tab)}>
                  {tab === "info"    && "📋 Info"}
                  {tab === "records" && `📁 Files (${patientFiles.length})`}
                  {tab === "notes"   && "📝 Notes"}
                </button>
              ))}
            </div>

            {activeTab === "info" && (
              <div className="tab-panel">
                <div className="info-grid">
                  <div className="info-card"><label>Full Name</label><span>{selectedPatient.first_name} {selectedPatient.last_name}</span></div>
                  <div className="info-card"><label>Birthdate</label><span>{selectedPatient.birthdate || "-"}</span></div>
                  <div className="info-card"><label>Age</label><span>{calculateAge(selectedPatient.birthdate) || "-"}</span></div>
                  <div className="info-card"><label>Contact</label><span>{selectedPatient.contact_number || "-"}</span></div>
                  <div className="info-card"><label>Email</label><span>{selectedPatient.email || "No email"}</span></div>
                  <div className="info-card"><label>Registered Since</label><span>{selectedPatient.created_at?.split("T")[0] || "-"}</span></div>
                  <div className="info-card"><label>Last Visit</label><span>{selectedPatient.is_guest ? "Guest Patient" : selectedPatient.last_visit || "-"}</span></div>
                </div>
              </div>
            )}

            {activeTab === "records" && (
              <div className="tab-panel">
                <select
  className="file-type-select"
  value={selectedFileType}
  onChange={(e) =>
    setSelectedFileType(
      e.target.value
    )
  }
>
  <option value="xray">X-Ray</option>
  <option value="lab">Laboratory Result</option>
  <option value="clearance">Medical Clearance</option>
  <option value="consent">Consent Form</option>
  <option value="other">Other</option>
</select>
{!selectedPatient.is_guest && (
                <div className={`upload-zone ${dragOver ? "upload-zone-drag" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => handleDrop(e, selectedPatient.id)} onClick={() => fileInputRef.current.click()}>
                  <input type="file" ref={fileInputRef} multiple accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => handleFileUpload(e.target.files, selectedPatient.id)} />
                  <div className="upload-icon">⬆️</div>
                  <p className="upload-text"><strong>Click to upload</strong> or drag and drop</p>
                  <p className="upload-sub">X-rays, records, photos, PDFs</p>
                </div>
)}
                {patientFiles.length === 0 ? (
                  <p className="no-files">No files uploaded yet.</p>
                ) : (
                  <ul className="file-list">
                    {patientFiles.map((r) => (
                      <li key={r.id} className="file-item">
                        <span className="file-type-icon">{FILE_ICON[r.type] || "📎"}</span>
                        <span className={`file-badge ${r.type}`}>{r.type}</span>
                        <div className="file-meta">
                          <span className="file-name">{r.name}</span>
                          <span className="file-date">{r.date} · {r.size}</span>
                        </div>

                        <div className="file-actions">
                          <button className="file-btn file-btn-view" onClick={() => { console.log("PREVIEW:", r); setPreviewFile(r); }}>View</button>
                          <button className="file-btn file-btn-delete" onClick={() => deleteRecord(r.id)}>✕</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {
  previewFile && (
    <div
      className="preview-overlay"
      onClick={() => setPreviewFile(null)}
    >
      <div
        className="preview-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="preview-close"
          onClick={() => setPreviewFile(null)}
        >
          ✕
        </button>

        {
          previewFile.mime_type?.includes("image")
          ? (
              <img
                src={previewFile.file_url}
                alt={previewFile.file_name}
                className="preview-image"
              />
            )
          : previewFile.mime_type?.includes("pdf")
          ? (
              <iframe
                src={previewFile.file_url}
                className="preview-pdf"
              />
            )
          : (
              <a
                href={previewFile.file_url}
                download
                className="download-btn"
              >
                Download File
              </a>
            )
        }
      </div>
    </div>
  )
}
            </div>
            )}

            {activeTab === "notes" && (
              <div className="tab-panel">
                <textarea className="notes-textarea" placeholder="Clinical notes, allergies, treatment reminders…" value={selectedPatient.notes || ""} onChange={handleNotesChange} />
                <p className="notes-hint">Notes are auto-saved as you type.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h3>New Patient</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            
            <div className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder="Juan Dela Cruz" />
                </div>

                <div className="form-group">
                  <label>Age *</label>
                  <input type="number" value={newForm.age} onChange={(e) => setNewForm((f) => ({ ...f, age: e.target.value }))} placeholder="30" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact</label>
                  <input value={newForm.contact} onChange={(e) => setNewForm((f) => ({ ...f, contact: e.target.value }))} placeholder="+63 9XX XXX XXXX" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newForm.email} onChange={(e) => setNewForm((f) => ({ ...f, email: e.target.value }))} placeholder="patient@email.com" />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Dentist</label>
                <select value={newForm.dentist} onChange={(e) => setNewForm((f) => ({ ...f, dentist: e.target.value }))}>
                  <option>Dr. Vannesa Cruz</option>
                </select>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="btn-submit" onClick={handleAddPatient}>Add Patient</button>
              </div>
            </div>
          </div>
      </div>
      )}
    </div>
  );
}

export default Patients;