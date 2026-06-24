import { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext";
import "../styles/dashboard.css";
import {
  getAppointmentStatsApi,
  getTreatmentStatsApi,
  getBalancesApi,
  getAppointmentsApi
} from "../api/appointments";
import { useNavigate }
from "react-router-dom";
import { Link } from "react-router-dom";


function Dashboard() 
{
  const navigate = useNavigate();
  const { permissions = {} } = useAuth();
  const [period, setPeriod] = useState("Month");
  const [clinicFilter, setClinicFilter] = useState("All");
  const [patientsWithBalance, setPatientsWithBalance] = useState([]);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [stats, setStats] =
useState({
  scheduled: 0,
  completed: 0,
  cancelled: 0,
  noShow: 0,
  pendingVerification: 0,
  revenue: 0
});
const [showAllBalances, setShowAllBalances] =
  useState(false);

const [pendingAppointments,
  setPendingAppointments] =
  useState([]);

const [showPendingModal,
  setShowPendingModal] =
  useState(false);

  const can = (module, action) => permissions[module]?.includes(action);

  const fetchStats =
  async () =>
{
  try
  {
    const response =
  await getAppointmentStatsApi(
  period.toLowerCase(),
  clinicFilter
);

    setStats(
      response.stats
    );
  }
  catch(error)
  {
    console.error(
      error
    );
  }
};

const fetchTreatments =
async () =>
{
  try
  {
    const response =
  await getTreatmentStatsApi(
  period.toLowerCase(),
  clinicFilter
);

    setTreatments(
      response.treatments || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
};

const fetchBalances =
async () =>
{
  try
  {
    const response =
      await getBalancesApi(
  clinicFilter
);

    setPatientsWithBalance(
      response.patients || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
};

const fetchPendingAppointments =
async () =>
{
  try
  {
    const response =
      await getAppointmentsApi();

    let pending =
  response.appointments.filter(
    a =>
      a.status ===
      "pending_verification"
  );

if(clinicFilter !== "All")
{
  pending =
    pending.filter(
      a =>
        a.branch_id ===
        clinicFilter
    );
}

    setPendingAppointments(
      pending
    );
  }
  catch(error)
  {
    console.error(error);
  }
};

useEffect(() =>
{
  fetchStats();
  fetchTreatments();
  fetchBalances();
  fetchPendingAppointments();
},
[period, clinicFilter]);

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="dashboard-content">
          {can("dashboard", "view") && (
            <div className="stats-grid">
              <div className="stat-card">
  <div className="stat-title">Scheduled</div>
  <div className="stat-value">
    {stats.scheduled}
  </div>
</div>

<div className="stat-card">
  <div className="stat-title">Completed</div>
  <div className="stat-value">
    {stats.completed}
  </div>
</div>

<div className="stat-card">
  <div className="stat-title">Cancelled</div>
  <div className="stat-value">
    {stats.cancelled}
  </div>
</div>

<div className="stat-card">
  <div className="stat-title">No-shows</div>
  <div className="stat-value">
    {stats.noShow}
  </div>
</div>
            </div>
          )}

          <div className="main-grid">

  <div className="left-column">

    {can("payments", "view") && (
      <div className="balance-card">
        <div className="balance-card-header">
          <h3>Patients w/ Balance</h3>
          <span
  className="see-all"
  onClick={() =>
    setShowAllBalances(true)
  }
>
  See All
</span>
        </div>

        {patientsWithBalance.length === 0 ? (
          <div className="empty-placeholder">
            No data available yet
          </div>
        ) : (
          <div className="balance-list">
           {patientsWithBalance
  .slice(0, 3)
  .map((p) => (
    <div
  className="balance-item"
  key={p.id}
  onClick={() =>
    setSelectedBalance(p)
  }
>
      <div>
        <span className="patient-name">
          {p.guest_name}
        </span>

        <span className="last-visit">
          Remaining Balance
        </span>
      </div>

      <span className="balance-amount">
        ₱{
          Number(
            p.remaining_balance
          ).toLocaleString()
        }
      </span>
    </div>
))}
          </div>
        )}
      </div>
    )}

    <div
  className="pending-verification-card"
  onClick={() =>
  setShowPendingModal(true)
}
>
      <div className="pending-header">
  Pending Payment Verification
  <span className="pending-click-hint">
    Click to view
  </span>
</div>

      <div className="pending-count">
        {stats.pendingVerification}
      </div>
    </div>

  </div>

  <div className="right-column">

    <div className="chart-card">
      <div className="chart-title">
        {period} Number of Treatments
      </div>

      <div className="chart-placeholder">

  {treatments.length === 0 ? (

    <p>No treatment data yet</p>

  ) : (

    <div className="treatment-chart">

      {treatments.map((treatment, index) => {

        const maxCount =
          Math.max(
            ...treatments.map(
              t => t.count
            )
          );

        const width =
          (treatment.count / maxCount)
          * 100;

        return (

          <div
            key={index}
            className="chart-row"
          >

            <div className="chart-header">

              <span className="chart-label">
                {treatment.name}
              </span>

              <span className="chart-value">
                {treatment.count}
              </span>

            </div>

            <div className="chart-track">

              <div
                className="chart-fill"
                style={{
                  width: `${width}%`
                }}
              />

            </div>

          </div>

        );

      })}

    </div>

  )}

</div>
    </div>

    <div className="sales-card">
      <h4>
        Total Sales for the {period}
      </h4>

      <p className="amount">
        ₱{stats.revenue?.toLocaleString()}
      </p>

      {can("reports", "view") && (
  <Link
    to="/reports"
    className="report-link"
  >
    Click Here for reports →
  </Link>
)}
    </div>

    <div className="filter-buttons">

      <select
  value={clinicFilter}
  onChange={(e) =>
    setClinicFilter(
      e.target.value
    )
  }
>
  <option value="All">
    All Clinics
  </option>
  <option value="Hagonoy">
    Hagonoy
  </option>
  <option value="Paombong">
    Paombong
  </option>
</select>
      {["Month", "Week", "Day"].map((p) => (
        <button
          key={p}
          className={
            period === p
              ? "active"
              : ""
          }
          onClick={() =>
            setPeriod(p)
          }
        >
          {p}
        </button>
      ))}
    </div>

  </div>

</div>

{showAllBalances && (

<div
  className="modal-overlay"
  onClick={() =>
    setShowAllBalances(false)
  }
>

  <div
    className="balance-modal"
    onClick={(e) =>
      e.stopPropagation()
    }
  >

    <div className="balance-modal-header">

      <h3>
        All Patients With Balance
      </h3>

      <button
        className="close-modal"
        onClick={() =>
          setShowAllBalances(false)
        }
      >
        ✕
      </button>

    </div>

    <div className="balance-modal-list">

      {patientsWithBalance.map(
        (p) => (

          <div
            key={p.id}
            className="balance-modal-item"
            onClick={() => {

              setShowAllBalances(
                false
              );

              setSelectedBalance(
                p
              );

            }}
          >

            <div>

              <div className="patient-name">
                {p.guest_name}
              </div>

              <div className="last-visit">
                Remaining Balance
              </div>

            </div>

            <div className="balance-amount">
              ₱{
                Number(
                  p.remaining_balance
                ).toLocaleString()
              }
            </div>

          </div>

        )
      )}

    </div>

  </div>

</div>

)}

{selectedBalance && (

<div
  className="modal-overlay"
  onClick={() =>
    setSelectedBalance(null)
  }
>

  <div
  className="payment-modal payment-details-modal"
  onClick={(e) =>
    e.stopPropagation()
  }
>

    <div className="modal-header">
      <h3>
        Payment Details
      </h3>
    </div>

    <div className="modal-body">

      <div className="modal-field">
        <label>Patient</label>

        <p className="modal-readonly">
          {selectedBalance.guest_name}
        </p>
      </div>

      <div className="modal-field">
        <label>Remaining Balance</label>

        <p className="modal-readonly">
          ₱{
            Number(
              selectedBalance.remaining_balance
            ).toLocaleString()
          }
        </p>
      </div>

      <div className="modal-field">
        <label>Status</label>

        <p className="modal-readonly">
          {selectedBalance.status}
        </p>
      </div>

      <div className="modal-field">
        <label>Payment Status</label>

        <p className="modal-readonly">
          {selectedBalance.payment_status}
        </p>
      </div>

    </div>

    <div className="modal-footer">

      <button
        className="btn-save"
        onClick={() => {

          localStorage.setItem(
            "highlightPaymentId",
            selectedBalance.id
          );

          navigate("/payments");
        }}
      >
        Go To Payment List
      </button>

      <button
        className="btn-cancel-edit"
        onClick={() =>
          setSelectedBalance(null)
        }
      >
        Close
      </button>

    </div>

  </div>

</div>

)}

{showPendingModal && (

<div
  className="modal-overlay"
  onClick={() =>
    setShowPendingModal(false)
  }
>

  <div
    className="payment-modal"
    onClick={(e) =>
      e.stopPropagation()
    }
  >

    <div className="modal-header">
      <h3>
        Pending Payment Verification
      </h3>
    </div>

    <div
      className="modal-body"
      style={{
        display: "block"
      }}
    >

      {pendingAppointments.length === 0 ? (

        <p>
          No pending verifications.
        </p>

      ) : (

        pendingAppointments.map(
          (appointment) => (

            <div
              key={appointment.id}
              className="balance-item"
              style={{
                marginBottom: "10px",
                cursor: "pointer"
              }}
              onClick={() => {

                setShowPendingModal(false);

                localStorage.setItem(
                  "calendarAppointmentId",
                  appointment.id
                );

                navigate("/calendar");
              }}
            >

              <div>
                <span
                  className="patient-name"
                >
                  {appointment.guest_name}
                </span>

                <span
  className="last-visit"
>
  {appointment.branch_id || "No branch"}
  {" • "}
  {appointment.appointment_date}
  {" • "}
  {appointment.appointment_time}
</span>
              </div>

            </div>

          )
        )

      )}

    </div>

    <div className="modal-footer">

      <button
        className="btn-cancel-edit"
        onClick={() =>
          setShowPendingModal(false)
        }
      >
        Close
      </button>

    </div>

  </div>

</div>

)}

        </div>
      </div>
    </div>
  );
}

export default Dashboard;