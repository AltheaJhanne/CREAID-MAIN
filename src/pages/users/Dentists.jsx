 import { useState, useEffect, useRef } from "react";
 import "../../styles/dentists.css";
 import { getDentistsApi } from "../../api/users";
 import { getPatientRecordsApi } from "../../api/patients";
 import { getMyPatientsApi, getDentistEarningsApi} from "../../api/appointments";
 import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
 
 const FORM_TEMPLATES = [
     { id: "reseta",   label: "📋 Prescription (Reseta)", icon: "💊" },
     { id: "xray",     label: "🦷 X-Ray Request",         icon: "🩻" },
     { id: "referral", label: "📨 Referral Letter",        icon: "📨" },
     { id: "medcert",  label: "📄 Medical Certificate",   icon: "📄" },
 ];
 
 function Dentists() 
 {
     const [dentists, setDentists]       = useState([]);
     const [myPatients, setMyPatients] = useState([]);
     const [selected, setSelected]       = useState(null);
     const [activeTab, setActiveTab]     = useState("overview");
     const [search, setSearch]           = useState("");
     const [showFormModal, setShowFormModal] = useState(null);
     const [esignMode, setEsignMode]     = useState(false);
     const [signatureText, setSignatureText] = useState("");
     const [signed, setSigned]           = useState(false);
     const [showRecordModal, setShowRecordModal] = useState(false);
     const [ selectedTreatment, setSelectedTreatment ] = useState(null);
     const [ showTreatmentModal, setShowTreatmentModal ] = useState(false);
     const [selectedRecordPatient, setSelectedRecordPatient] = useState(null);
     const [patientRecords, setPatientRecords] = useState([]);
     const [requestAction, setRequestAction] = useState({});
     const [sidebarOpen, setSidebarOpen] = useState(false);
     const [earnings, setEarnings] = useState([]);
     const [branchFilter, setBranchFilter] = useState("All");
     const [dailyCommission, setDailyCommission] = useState(0);
     const [totalCommission, setTotalCommission] = useState(0);
     const [totalEarnings, setTotalEarnings] = useState(0); 
     const printRef = useRef();
 
     const chartData =
   earnings.map((item) => ({
     ...item,
 
     appointment_date:
       new Date(
         item.appointment_date
       ).toLocaleDateString(
         "en-PH",
         {
           month: "short",
           day: "numeric"
         }
       )
   }));
     const filtered =
   dentists.filter((d) =>
   {
     const fullName =
       `${d.first_name || ""}
        ${d.last_name || ""}`
       .toLowerCase();
 
     const matchesSearch =
       fullName.includes(
         (search || "")
           .toLowerCase()
       );
 
     const matchesBranch =
       branchFilter === "All" ||
       d.branch_id === branchFilter;
 
     return (
       matchesSearch &&
       matchesBranch
     );
   });
     useEffect(() =>
 {
   loadDentists();
 }, []);
 
 function handlePrint()
 {
   const printContents =
     printRef.current.innerHTML;
 
   const printWindow =
     window.open("", "", "width=900,height=700");
 
   printWindow.document.write(`
     <html>
       <head>
         <title>DentConnect Form</title>
       </head>
       <body>
         ${printContents}
       </body>
     </html>
   `);
 
   printWindow.document.close();
   printWindow.focus();
   printWindow.print();
 }
 
 function handleViewTreatment(
   record
 )
 {
   setSelectedTreatment(
     record
   );
 
   setShowTreatmentModal(
     true
   );
 }
 async function handleViewRecord(
   patient
 )
 {
   setSelectedRecordPatient(
     patient
   );
 
   try
   {
     const response =
   await getPatientRecordsApi(
     patient.id
   );
 
 console.log(
   "PATIENT RECORDS:",
   response.records
 );
 
 setPatientRecords(
   response.records || []
 );
   }
   catch(error)
   {
     console.error(error);
 
     setPatientRecords([]);
   }
 
   setShowRecordModal(true);
 }
 
 async function handleDownloadPdf()
 {
   const element =
     printRef.current;
 
   const canvas =
     await html2canvas(element);
 
   const imgData =
     canvas.toDataURL("image/png");
 
   const pdf =
     new jsPDF("p", "mm", "a4");
 
   const pdfWidth =
     pdf.internal.pageSize.getWidth();
 
   const pdfHeight =
     (canvas.height * pdfWidth) /
     canvas.width;
 
   pdf.addImage(
     imgData,
     "PNG",
     0,
     0,
     pdfWidth,
     pdfHeight
   );
 
   pdf.save(
     `${showFormModal.label}.pdf`
   );
 }
 
 async function loadDentists()
 {
   try
   {
     const response =
       await getDentistsApi();
 
     console.log(
       "DENTISTS:",
       response.dentists
     );
 
     setDentists(
       response.dentists || []
     );
   }
   catch(error)
   {
     console.error(error);
   }
 }
     const selectedDentist = dentists.find(d => d.id === selected);
 
     function handleRequestAction(dentistId, reqId, action) 
     {
         setRequestAction((prev) => ({ ...prev, [`${dentistId}-${reqId}`]: action }));
     }
 
     function handleESign(e) {
     e.preventDefault();
 
     if(signatureText.trim().length > 2)
     {
         setSigned(true);
         setEsignMode(false);
     }
 }
 
     async function handleSelectDentist(id)
 {
     setSelected(id);
     setActiveTab("overview");
     setSidebarOpen(false);
 
     try
     {
         const patientResponse =
             await getMyPatientsApi(id);
 
         setMyPatients(
             patientResponse.patients || []
         );
 
         const earningsResponse =
             await getDentistEarningsApi(id);
 
         const earningsData =
             earningsResponse.earnings || [];
 
         setEarnings(
             earningsData
         );
 
         const totalCommissionAmount =
             earningsData.reduce(
                 (sum, item) =>
                     sum +
                     Number(item.commission || 0),
                 0
             );
 
         const totalEarningsAmount =
             earningsData.reduce(
                 (sum, item) =>
                     sum +
                     Number(item.daily_earning || 0),
                 0
             );
 
         const today =
             new Date()
                 .toISOString()
                 .split("T")[0];
 
         const todayCommission =
             earningsData
                 .filter(
                     item =>
                         item.appointment_date === today
                 )
                 .reduce(
                     (sum, item) =>
                         sum +
                         Number(item.commission || 0),
                     0
                 );
 
         setDailyCommission(
             todayCommission
         );
 
         setTotalCommission(
             totalCommissionAmount
         );
 
         setTotalEarnings(
             totalEarningsAmount
         );
 
         console.log(
             "PATIENTS:",
             patientResponse.patients
         );
 
         console.log(
             "EARNINGS:",
             earningsData
         );
     }
     catch(error)
     {
         console.error(error);
     }
 }
 
     const STATUS_COLOR = 
     {
         Available:  "status-available",
         Busy:       "status-busy",
         "Off-Duty": "status-off",
     };
 
     return (
         <div className="dentists-root">
 
             <button className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle dentist list">
                 {sidebarOpen ? "✕" : "👨‍⚕️ Dentists"}
             </button>
 
             {sidebarOpen && (
                 <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
             )}
 
             <aside className={`dentists-sidebar${sidebarOpen ? " sidebar-open" : ""}`}>
 
                 <div className="sidebar-header">
                     <h1 className="sidebar-title">
                         <span>👨‍⚕️</span> Dentists
                     </h1>
                 </div>
                 <div className="branch-filter-wrap">
   <select
     value={branchFilter}
     onChange={(e) =>
       setBranchFilter(
         e.target.value
       )
     }
     className="branch-filter"
   >
     <option value="All">
       All Branches
     </option>
 
     <option value="Hagonoy">
       Hagonoy
     </option>
 
     <option value="Paombong">
       Paombong
     </option>
   </select>
 </div>
                 <div className="sidebar-search-wrap">
                     <span className="search-icon">⌕</span>
                     <input className="search-input" placeholder="Search dentist or specialty…" value={search} onChange={(e) => setSearch(e.target.value)}/>
                 </div>
 
                 <ul className="dentist-list">
                     {filtered.map((d) => (
                         <li key={d.id} className={`dentist-item ${selected === d.id ? "dentist-item-selected" : ""}`} onClick={() => handleSelectDentist(d.id)}>
                             <div className="dentist-avatar">
   {d.avatar_url ? (
     <img
       src={d.avatar_url}
       alt={`${d.first_name} ${d.last_name}`}
       className="dentist-avatar-img"
     />
   ) : (
     <>
       {(d.first_name?.[0] || "")}
       {(d.last_name?.[0] || "")}
     </>
   )}
 </div>
                             <div className="dentist-meta">
                                 <span className="dentist-name">{d.first_name} {d.last_name}</span>
                                 <span className="dentist-spec">Dentist</span>
                             </div>
                             <span className={`status-pill ${STATUS_COLOR[d.status]}-pill`}>
                                 {d.status}
                             </span>
                         </li>
                     ))}
                 </ul>
 
             </aside>
 
             <main className="dentists-detail">
                 {!selectedDentist ? (
                     <div className="detail-empty">
                         <div className="empty-icon">👨‍⚕️</div>
                         <p>Select a dentist to view their profile</p>
                     </div>
                 ) : (
                     <div className="detail-content">
 
                         <div className="detail-hero">
                             <div className="dentist-avatar-lg">
   {selectedDentist.avatar_url ? (
     <img
       src={selectedDentist.avatar_url}
       alt={`${selectedDentist.first_name} ${selectedDentist.last_name}`}
       className="dentist-avatar-lg-img"
     />
   ) : (
     <>
       {(selectedDentist.first_name?.[0] || "")}
       {(selectedDentist.last_name?.[0] || "")}
     </>
   )}
 </div>
                             <div className="detail-hero-info">
                                 <h2 className="detail-name">{`${selectedDentist.first_name} ${selectedDentist.last_name}`}</h2>
                                 <p className="detail-spec">"Dentist"</p>
                                 <p className="detail-sub">{selectedDentist.contact} · {selectedDentist.email}</p>
                                 <p className="detail-schedule">⏰ {selectedDentist.schedule}</p>
                             </div>
                             <div className="detail-hero-right">
                                 <span className={`status-pill ${STATUS_COLOR[selectedDentist.status]}-pill`}>
                                     {selectedDentist.status}
                                 </span>
                                 <div className="commission-box">
     <span className="commission-label">
         Today's Commission
     </span>
 
     <span className="commission-value">
         ₱{Number(dailyCommission || 0).toLocaleString()}
     </span>
 
     <span className="commission-rate">
         Total Commission:
         ₱{Number(totalCommission || 0).toLocaleString()}
     </span>
 </div>
                             </div>
                         </div>
 
                         <div className="detail-tabs">
                             {[
                                 { key: "overview",  label: "📊 Overview" },
                                 { key: "patients",  label: `🧑‍🦷 Patients` },
                                 { key: "forms",     label: "📝 Forms" },
                             ].map(({ key, label }) => (
                                 <button key={key} className={`tab-btn ${activeTab === key ? "tab-active" : ""}`} onClick={() => setActiveTab(key)}>
                                     {label}
                                 </button>
                             ))}
                         </div>
 
                         {activeTab === "overview" && (
   <div className="tab-panel">
 
     <div className="overview-grid">
 
       <div className="ov-card ov-card-highlight">
         <span className="ov-icon">💰</span>
         <div>
           <span className="ov-value">
             ₱{Number(dailyCommission || 0).toLocaleString()}
           </span>
           <span className="ov-label">
             Today's Commission
           </span>
         </div>
       </div>
 
       <div className="ov-card">
         <span className="ov-icon">📈</span>
         <div>
           <span className="ov-value">
             ₱{Number(totalCommission || 0).toLocaleString()}
           </span>
           <span className="ov-label">
             Total Commission
           </span>
         </div>
       </div>
 
       <div className="ov-card">
         <span className="ov-icon">₱</span>
         <div>
           <span className="ov-value">
             ₱{Number(totalEarnings || 0).toLocaleString()}
           </span>
           <span className="ov-label">
             Total Earnings
           </span>
         </div>
       </div>
 
       <div className="ov-card">
         <span className="ov-icon">🧑‍🦷</span>
         <div>
           <span className="ov-value">
             {myPatients.length}
           </span>
           <span className="ov-label">
             Patients Handled
           </span>
         </div>
       </div>
     </div>
           <div className="section-card">
   <h3 className="section-title">
     💰 Commission Trend
   </h3>
 
   <div
     style={{
       width: "100%",
       height: "350px"
     }}
   >
     <ResponsiveContainer
  width="100%"
  height={300}
>
       <BarChart data={chartData}>
         <CartesianGrid
           strokeDasharray="3 3"
         />
 
         <XAxis
           dataKey="appointment_date"
         />
 
         <YAxis />
 
         <Tooltip />
 
         <Bar
   dataKey="commission"
   name="Commission"
   fill="#FA1377"
 />
 
 <Bar
   dataKey="daily_earning"
   name="Earnings"
   fill="#150e43"
 />
       </BarChart>
     </ResponsiveContainer>
   </div>
 </div>
 
   </div>
 )}
 
                         {activeTab === "patients" && (
   <div className="tab-panel">
     {myPatients.length === 0 ? (
       <p className="no-data-center">
         No patients handled yet.
       </p>
     ) : (
       <ul className="handled-list">
         {myPatients.map((p) => (
             console.log("PATIENT OBJECT:", p),
           <li
             key={p.id}
             className="handled-item"
           >
             <div className="handled-avatar">
 {
   p.avatar_url ? (
     <img
       src={p.avatar_url}
       alt={p.name}
       className="handled-avatar-img"
     />
   ) : (
     p.name
       ?.split(" ")
       .map(n => n[0])
       .join("")
       .slice(0, 2)
   )
 }
 </div>
 
             <div className="handled-meta">
               <span className="handled-name">
                 {p.name}
               </span>
 
               <span className="handled-proc">
                 {p.reason_for_visit}
               </span>
             </div>
 
             <div className="handled-date">
               <span className="date-label">
                 Last Visit
               </span>
 
               <span className="date-val">
                 {p.appointment_date}
               </span>
             </div>
 
             <button
   className="view-record-btn"
   onClick={() =>
     handleViewRecord(p)
   }
 >
   View Record
 </button>
           </li>
         ))}
       </ul>
     )}
     { 
 showRecordModal &&
 selectedRecordPatient && (
 
 <div
   className="record-modal-overlay"
   onClick={() =>
     setShowRecordModal(false)
   }
 >
 
 <div
   className="record-modal"
   onClick={(e) =>
     e.stopPropagation()
   }
 >
 
 <button
   className="record-modal-close"
   onClick={() =>
     setShowRecordModal(false)
   }
 >
   ✕
 </button>
 
 <h2>
   Patient Record
 </h2>
 
 <div className="record-header">
 
   <div className="record-avatar">
 
     {selectedRecordPatient.avatar_url ? (
 
       <img
         src={
           selectedRecordPatient.avatar_url
         }
         alt=""
       />
 
     ) : (
 
       <span>
         {selectedRecordPatient.name
           ?.split(" ")
           .map(
             n => n[0]
           )
           .join("")
           .slice(0, 2)}
       </span>
 
     )}
 
   </div>
 
   <div className="record-header-info">
 
     <h3>
       {selectedRecordPatient.name}
     </h3>
 
     <p>
       📞 {selectedRecordPatient.contact}
     </p>
 
     <p>
       📧 {selectedRecordPatient.email}
     </p>
 
   </div>
 
 </div>
 
 <h3>
   Treatment History
 </h3>
 
 {
 patientRecords.length === 0 ? (
 
 <p>
   No records found.
 </p>
 
 ) : (
 
 <div className="record-history">
 
 {
 patientRecords.map(record => (
   <div
     key={record.id}
     className="record-card"
   >
     <div className="record-date">
       📅 {record.record_date}
     </div>
 
     <h4>
       🦷 {record.treatment_name}
     </h4>
 
     <button
       className="record-action-btn"
       onClick={() =>
         handleViewTreatment(
           record
         )
       }
     >
       View Record
     </button>
   </div>
 ))
 }
 {
 showTreatmentModal &&
 selectedTreatment && (
 
 <div
   className="record-modal-overlay"
   onClick={() =>
     setShowTreatmentModal(false)
   }
 >
 
 <div
   className="record-modal"
   onClick={(e) =>
     e.stopPropagation()
   }
 >
 
 <button
   className="record-modal-close"
   onClick={() =>
     setShowTreatmentModal(false)
   }
 >
   ✕
 </button>
 
 <h2>
   {selectedTreatment.treatment_name}
 </h2>
 
 <p>
   📅
   {" "}
   {selectedTreatment.record_date}
 </p>
 
 <hr />
 
 <p>
   <strong>
     Diagnosis:
   </strong>
 </p>
 
 <p>
   {selectedTreatment.diagnosis}
 </p>
 
 <p>
   <strong>
     Prescription:
   </strong>
 </p>
 
 <p>
   {selectedTreatment.prescription}
 </p>
 
 <p>
   <strong>
     Notes:
   </strong>
 </p>
 
 <p>
   {selectedTreatment.notes}
 </p>
 
 {
 selectedTreatment.document_url && (
 
 <>
 <h4>
   Attachment
 </h4>
 
 <a
   href={
     selectedTreatment.document_url
   }
   target="_blank"
   rel="noreferrer"
 >
   Open Full File
 </a>
 </>
 
 )}
 
 </div>
 </div>
 
 )}
 
 </div>
 
 )}
 
 </div>
 </div>
 
 )}
   </div>
 )}
 
                         
 
 {activeTab === "forms" && (
   <div className="tab-panel">
 
     <p className="forms-intro">
       Prepare and e-sign clinical forms for your patients.
       Choose a template below.
     </p>
 
     <div className="forms-grid">
 
       {FORM_TEMPLATES.map((f) => (
 
         <div
           key={f.id}
           className="form-card"
           onClick={() =>
           {
             setShowFormModal(f);
             setEsignMode(false);
             setSigned(false);
             setSignatureText("");
           }}
         >
 
           <span className="form-card-icon">
             {f.icon}
           </span>
 
           <span className="form-card-label">
             {f.label}
           </span>
 
           <span className="form-card-action">
             Prepare →
           </span>
 
         </div>
 
       ))}
 
     </div>
 
   </div>
 )}
                     </div>
                 )}
                 {showFormModal && (
 
 <div
   className="modal-overlay"
   onClick={() =>
     setShowFormModal(null)
   }
 >
 
 <div
   className="form-modal modal-form-doc"
   onClick={(e) =>
     e.stopPropagation()
   }
 >
 
 <div className="modal-header">
 
   <h3>
     {showFormModal.label}
   </h3>
 
   <button
     className="modal-close"
     onClick={() =>
       setShowFormModal(null)
     }
   >
     ✕
   </button>
 
 </div>
 
 <div className="form-doc-body">
 
   <div className="doc-preview"
   ref={printRef}>
 
     <div className="doc-letterhead">
 
       <span className="doc-clinic">
         🦷 Juana Smile Dental Clinic
       </span>
 
       <span className="doc-address">
         DentConnect Patient Forms
       </span>
 
     </div>
 
     <div className="doc-divider" />
 
     {showFormModal.id === "reseta" && (
       <div className="doc-content">
 
         <h4 className="doc-title">
           PRESCRIPTION
         </h4>
 
         <div className="doc-field">
           <label>Patient Name:</label>
           <div className="doc-input-line" />
         </div>
 
         <div className="doc-field">
           <label>Date:</label>
           <div className="doc-input-line" />
         </div>
 
         <div className="doc-rx">
           ℞
         </div>
 
         <div className="doc-rx-lines">
           <div className="doc-input-line long" />
           <div className="doc-input-line long" />
           <div className="doc-input-line long" />
         </div>
 
       </div>
     )}
 
     {showFormModal.id === "medcert" && (
       <div className="doc-content">
 
         <h4 className="doc-title">
           MEDICAL CERTIFICATE
         </h4>
 
         <p className="doc-para">
           To Whom It May Concern:
         </p>
 
         <p className="doc-para">
           This is to certify that
         </p>
 
         <div className="doc-input-line long" />
 
         <p className="doc-para">
           was examined and is currently
           under my care for dental treatment.
         </p>
 
       </div>
     )}
 
     {showFormModal.id === "referral" && (
       <div className="doc-content">
 
         <h4 className="doc-title">
           REFERRAL LETTER
         </h4>
 
         <div className="doc-field">
           <label>Patient:</label>
           <div className="doc-input-line" />
         </div>
 
         <div className="doc-field">
           <label>Referred To:</label>
           <div className="doc-input-line" />
         </div>
 
       </div>
     )}
 
     {showFormModal.id === "xray" && (
       <div className="doc-content">
 
         <h4 className="doc-title">
           X-RAY REQUEST
         </h4>
 
         <div className="doc-field">
           <label>Patient:</label>
           <div className="doc-input-line" />
         </div>
 
       </div>
     )}
 
     <div className="esign-section">
 
       {!signed ? (
 
         <>
 
           <div className="esign-label">
             {selectedDentist?.first_name}
             {" "}
             {selectedDentist?.last_name}
           </div>
 
           <div className="esign-title">
             Dentist
           </div>
 
           {!esignMode ? (
 
             <button
               className="btn-esign"
               onClick={() =>
                 setEsignMode(true)
               }
             >
               ✍️ Add E-Signature
             </button>
 
           ) : (
 
             <form
               className="esign-form"
               onSubmit={handleESign}
             >
 
               <input
                 className="esign-input"
                 placeholder="Type your full name..."
                 value={signatureText}
                 onChange={(e) =>
                   setSignatureText(
                     e.target.value
                   )
                 }
               />
 
               <div className="esign-btns">
 
                 <button
                   type="button"
                   className="btn-esign-cancel"
                   onClick={() =>
                     setEsignMode(false)
                   }
                 >
                   Cancel
                 </button>
 
                 <button
                   type="submit"
                   className="btn-esign-confirm"
                 >
                   Sign Document
                 </button>
 
               </div>
 
             </form>
 
           )}
 
         </>
 
       ) : (
 
         <div className="signed-stamp">
 
           <div className="signature-text">
             {signatureText}
           </div>
 
           <div className="signed-label">
             ✅ E-Signed
           </div>
 
         </div>
 
       )}
 
     </div>
 
   </div>
 
   <div className="form-doc-actions">
 
     <button className="btn-print" onClick={handlePrint}>
       🖨️ Print
     </button>
 
     <button className="btn-download" onClick={handleDownloadPdf}>
       ⬇️ Download PDF
     </button>
 
     <button className="btn-send">
       📤 Send to Patient
     </button>
 
   </div>
 
 </div>
 
 </div>
 
 </div>
 
 )}
             </main>
         </div>
     );
 }
 
 export default Dentists;