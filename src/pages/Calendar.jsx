import { useState, useEffect } from "react";
import "../styles/calendar.css";
import {
  getAppointmentsApi,
  updateAppointmentStatusApi,
  confirmDownpaymentApi,
  getAppointmentServicesApi,
  rescheduleAppointmentApi,
  rejectAppointmentApi
} from "../api/appointments";
import { supabase } from '../lib/supabase'
import {
  useNavigate
}
from "react-router-dom";

function Calendar() 
{
  const navigate = useNavigate();
  const [view, setView] = useState("month"); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [appointmentServices, setAppointmentServices] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [clinicFilter, setClinicFilter] = useState("All");
  const [showReschedule, setShowReschedule] =
  useState(false);

  const [showRejectModal, setShowRejectModal] =
  useState(false);

const [rejectReason, setRejectReason] =
  useState("");

const [newDate, setNewDate] =
  useState("");

const [newTime, setNewTime] =
  useState("");

  useEffect(() => {

  const savedFilter =
    localStorage.getItem(
      "calendarFilter"
    );

  if (savedFilter)
  {
    setStatusFilter(savedFilter);

    localStorage.removeItem(
      "calendarFilter"
    );
  }

}, []);

useEffect(() => {

  fetchAppointments();

}, []);

useEffect(() =>
{
  const appointmentId =
    localStorage.getItem(
      "calendarAppointmentId"
    );

  if (
    !appointmentId ||
    appointments.length === 0
  ) {
    return;
  }

  const appointment =
    appointments.find(
      appt =>
        appt.id === appointmentId
    );

  if (appointment)
{
  const appointmentDate =
    new Date(
      appointment.appointment_date
    );

  setCurrentDate(
    appointmentDate
  );

  setView("day");

  setTimeout(() =>
  {
    setSelectedAppointment(
      appointment
    );

    loadAppointmentServices(
      appointment.id
    );
  }, 300);
}

  localStorage.removeItem(
    "calendarAppointmentId"
  );
},
[appointments]);

async function rejectBooking()
{
  try
  {
    await rejectAppointmentApi(
  selectedAppointment.id,
  rejectReason
);

    await fetchAppointments();

    setShowRejectModal(false);

    setRejectReason("");

    setSelectedAppointment(null);
  }
  catch(error)
  {
    console.error(error);
  }
}

async function loadAppointmentServices(
  appointmentId
)
{
  try
  {
    const response =
      await getAppointmentServicesApi(
        appointmentId
      );

    console.log(
      "CALENDAR SERVICES:",
      response
    );

    console.log(
  "SERVICE DURATIONS:",
  response.services
);

console.log(
  "FIRST SERVICE:",
  response.services?.[0]
);

    setAppointmentServices(
      response.services || []
    );
  }
  catch(error)
  {
    console.error(error);

    setAppointmentServices([]);
  }
}

const markAsNoShow = async () => {
  const confirmNoShow =
    window.confirm(
      "Are you sure you want to mark this appointment as No Show?"
    );

  if (!confirmNoShow) return;

  try {
    await updateAppointmentStatusApi(
      selectedAppointment.id,
      "no_show"
    );

    await fetchAppointments();
    setSelectedAppointment(null);
  } catch (err) {
    console.error(err);
  }
};

const undoNoShow =
async () =>
{
  try
  {
    await confirmDownpaymentApi(
  selectedAppointment.id
);

    setAppointments(prev =>
      prev.map(appt =>
        appt.id ===
        selectedAppointment.id
          ? {
              ...appt,
              status:
                "scheduled"
            }
          : appt
      )
    );

    setSelectedAppointment(
      null
    );
  }
  catch(err)
  {
    console.error(err);
  }
};

const markAsDone =
async () =>
{
  try
  {
    await updateAppointmentStatusApi(
      selectedAppointment.id,
      "completed"
    );

    setAppointments(prev =>
      prev.map(appt =>
        appt.id ===
        selectedAppointment.id
          ? {
              ...appt,
              status:
                "completed"
            }
          : appt
      )
    );

    setSelectedAppointment(
      null
    );
  }
  catch(err)
  {
    console.error(err);
  }
};

const markAsIncomplete =
async () =>
{
  try
  {
    await confirmDownpaymentApi(
  selectedAppointment.id
);

    setAppointments(prev =>
      prev.map(appt =>
        appt.id ===
        selectedAppointment.id
          ? {
              ...appt,
              status:
                "scheduled"
            }
          : appt
      )
    );

    setSelectedAppointment(
      null
    );
  }
  catch(err)
  {
    console.error(err);
  }
};

const cancelAppointment =
async () =>
{
  const confirmCancel =
    window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

  if (!confirmCancel) return;

  try
  {
    await updateAppointmentStatusApi(
      selectedAppointment.id,
      "cancelled"
    );

    await fetchAppointments();

    setSelectedAppointment(null);
  }
  catch(err)
  {
    console.error(err);
  }
};

const undoCancel =
async () =>
{
  try
  {
    await confirmDownpaymentApi(
  selectedAppointment.id
);

    await fetchAppointments();

    setSelectedAppointment(null);
  }
  catch(err)
  {
    console.error(err);
  }
};

async function handleReschedule()
{
  try
  {
    if (
      !newDate ||
      !newTime
    ) {
      alert(
        "Please select a new date and time."
      );

      return;
    }

    const newStartMinutes =
      convertTimeToMinutes(newTime);

    const newEndTime =
      convertMinutesToTime(
        newStartMinutes +
        rescheduleDuration
      );

    await rescheduleAppointmentApi(
      selectedAppointment.id,
      {
        appointment_date:
          newDate,

        appointment_time:
          newTime,

        appointment_end_time:
          newEndTime
      }
    );

    await fetchAppointments();

    setShowReschedule(false);
    setSelectedAppointment(null);
  }
  catch(error)
  {
    console.error(error);
  }
}

const fetchAppointments =
async () =>
{
  try
  {
    const result =
      await getAppointmentsApi();

    console.log(
  "APPOINTMENTS:",
  result.appointments
);

    setAppointments(
      result.appointments || []
    );
  }
  catch(err)
  {
    console.error(err);
  }
};

let filteredAppointments =
  statusFilter
    ? appointments.filter(
        appt =>
          appt.status ===
          statusFilter
      )
    : appointments;

if(clinicFilter !== "All")
{
  filteredAppointments =
    filteredAppointments.filter(
      appt =>
        appt.branch_id ===
        clinicFilter
    );
}

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const dayNumber = currentDate.getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const weekdayName = currentDate.toLocaleString("default", { weekday: "long" });
  const firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const getStatusClass = (
  status
) => {

  switch(status){

    case "pending_payment":
      return "pending-payment";

    case "pending_verification":
      return "pending-verification";

    case "rejected":
  return "rejected";

    case "scheduled":
      return "scheduled";

    case "completed":
      return "completed";

    case "cancelled":
      return "cancelled";

    case "no_show":
      return "no-show";

    default:
      return "";

  }

};

const convertTimeToMinutes =
(timeString) =>
{
  const [time, period] =
    timeString.split(" ");

  let [hours, minutes] =
    time.split(":").map(Number);

  if (
    period === "PM" &&
    hours !== 12
  )
  {
    hours += 12;
  }

  if (
    period === "AM" &&
    hours === 12
  )
  {
    hours = 0;
  }

  return (
    hours * 60 +
    minutes
  );
};

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

const rescheduleDuration =
  appointmentServices.length > 0
    ? appointmentServices.reduce(
        (sum, service) =>
          sum +
          Number(
            service.duration_minutes || 0
          ),
        0
      )
    : 60;

const availableTimeSlots = [
  "10:00 AM",
  "10:30 AM",

  "11:00 AM",
  "11:30 AM",

  "1:00 PM",
  "1:30 PM",

  "2:00 PM",
  "2:30 PM",

  "3:00 PM",
  "3:30 PM",

  "4:00 PM",
  "4:30 PM"
];

const convertMinutesToTime =
(minutes) =>
{
  let hours =
    Math.floor(minutes / 60);

  const mins =
    minutes % 60;

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  if (hours > 12)
  {
    hours -= 12;
  }

  if (hours === 0)
  {
    hours = 12;
  }

  return `${hours}:${String(mins).padStart(2, "0")} ${period}`;
};

const availableSlots =
  availableTimeSlots.filter((time) =>
  {
    if (
      !newDate ||
      !rescheduleDuration
    ) {
      return false;
    }

    const candidateStart =
      convertTimeToMinutes(time);

    const candidateEnd =
      candidateStart +
      rescheduleDuration;

    const lunchStart =
      12 * 60;

    const lunchEnd =
      13 * 60;

    const clinicClose =
      17 * 60;

    if (
      candidateEnd >
      clinicClose
    ) {
      return false;
    }

    if (
      candidateStart < lunchStart &&
      candidateEnd > lunchStart
    ) {
      return false;
    }

    if (
      candidateStart >= lunchStart &&
      candidateStart < lunchEnd
    ) {
      return false;
    }

    const hasConflict =
      appointments.some((appointment) =>
      {
        if (
          appointment.id ===
          selectedAppointment?.id
        ) {
          return false;
        }

        if (
          appointment.appointment_date !==
          newDate
        ) {
          return false;
        }

        if (
          appointment.status !== "scheduled" &&
          appointment.status !== "pending_verification"
        ) {
          return false;
        }

        const existingStart =
          convertTimeToMinutes(
            appointment.appointment_time
          );

        const existingEnd =
          convertTimeToMinutes(
            appointment.appointment_end_time
          );

        return (
          candidateStart < existingEnd &&
          candidateEnd > existingStart
        );
      });

      return !hasConflict;
  });


  return (
    <div className="calendar-content">
      <div className="calendar-card">
        <div className="calendar-header">
          <div className="calendar-title-row">

  <span
    className="calendar-arrow"
    onClick={() => {
      const newDate =
        new Date(currentDate);

      if(view === "day")
        newDate.setDate(
          currentDate.getDate() - 1
        );
      else if(view === "week")
        newDate.setDate(
          currentDate.getDate() - 7
        );
      else if(view === "month")
        newDate.setMonth(
          currentDate.getMonth() - 1
        );
      else
        newDate.setFullYear(
          currentDate.getFullYear() - 1
        );

      setCurrentDate(newDate);
    }}
  >
    ‹
  </span>

  <h2 className="calendar-title">
    {view === "year" && year}
    {view === "month" && `${monthName} ${year}`}
    {(view === "week" || view === "day") &&
      `${weekdayName}, ${monthName} ${dayNumber}`}
  </h2>

  <span
    className="calendar-arrow"
    onClick={() => {
      const newDate =
        new Date(currentDate);

      if(view === "day")
        newDate.setDate(
          currentDate.getDate() + 1
        );
      else if(view === "week")
        newDate.setDate(
          currentDate.getDate() + 7
        );
      else if(view === "month")
        newDate.setMonth(
          currentDate.getMonth() + 1
        );
      else
        newDate.setFullYear(
          currentDate.getFullYear() + 1
        );

      setCurrentDate(newDate);
    }}
  >
    ›
  </span>

</div>

          <div className="calendar-filters">
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
            {["year", "month", "week", "day"].map(v => (
              <button key={v} className={view === v ? "active" : ""} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {
statusFilter ===
"pending_verification" && (

<div className="calendar-alert">

  Showing Pending
  Verification
  Appointments

</div>

)}

        {view === "year" && (
          <div className="year-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="month-card" onClick={() => { setCurrentDate(new Date(year, i, 1)); setView("month"); }}>
                {new Date(year, i).toLocaleString("default", { month: "long" })}
              </div>
            ))}
          </div>
        )}

        {view === "month" && (
          <div className="month-calendar">
            <div className="weekday-row">
              {weekDays.map(d => (
                <div key={d} className="weekday-cell">{d}</div>
              ))}
            </div>

            <div className="calendar-grid">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`start-${i}`} className="calendar-cell empty" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const dateString =
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;

     const dayAppointments =
  filteredAppointments.filter(
    appt =>
      appt.appointment_date ===
      dateString
  );

const hasEvent =
  dayAppointments.length > 0;

let dayStatus = "";

if (
  dayAppointments.some(
    a =>
      a.status ===
      "pending_verification"
  )
) {
  dayStatus =
    "day-pending";
}
else if (
  dayAppointments.some(
    a =>
      a.status ===
      "scheduled"
  )
) {
  dayStatus =
    "day-scheduled";
}
else if (
  dayAppointments.some(
    a => a.status === "cancelled"
  )
)
{
  dayStatus = "day-cancelled";
}
else if (
  dayAppointments.some(
    a => a.status === "rejected"
  )
)
{
  dayStatus = "day-rejected";
}

else if (
  dayAppointments.some(
    a => a.status === "no_show"
  )
)
{
  dayStatus = "day-no-show";
}
else if (
  dayAppointments.length > 0
) {
  dayStatus =
    "day-completed";
}
                return (
                  <div
                    key={i}
                    className={`calendar-cell ${hasEvent ? "has-event" : ""} ${dayStatus}`}
                    onClick={() => { setCurrentDate(new Date(year, monthIndex, i + 1)); setView("day"); }}
                  >
                    {i + 1}
                  </div>
                );
              })}

              {Array.from({ length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7 }).map((_, i) => (
                <div key={`end-${i}`} className="calendar-cell empty" />
              ))}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="week-calendar">
            <div className="week-header">
              <div className="time-col-header"></div>

              {Array.from({ length: 7 }, (_, i) => {
                const d = new Date(currentDate);
                d.setDate(dayNumber - d.getDay() + i);
                return (
                  <div
                    key={i}
                    className={`week-day-header ${d.toDateString() === new Date().toDateString() ? "today" : ""}`}
                  >
                    <strong>{d.toLocaleString("default", { weekday: "long" })}</strong>
                    <div className="week-date">
                      {d.toLocaleString("default", { month: "short" })} {d.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="week-body">
              <div className="time-column">
                {Array.from({ length: 16 }, (_, i) => (
                  <div key={i} className="time-cell">{7 + i}:00</div>
                ))}
              </div>

              <div className="week-grid-columns">

  {Array.from({ length: 7 }).map((_, dayIndex) => {

    const dayDate = new Date(currentDate);

    dayDate.setDate(
      currentDate.getDate() -
      currentDate.getDay() +
      dayIndex
    );

    const dateString =
      `${dayDate.getFullYear()}-${String(
        dayDate.getMonth() + 1
      ).padStart(2, "0")}-${String(
        dayDate.getDate()
      ).padStart(2, "0")}`;

    const dayAppointments =
  filteredAppointments.filter(
        appt =>
          appt.appointment_date ===
          dateString
      );

    return (
      <div
        key={dayIndex}
        className="week-day-column"
      >

        {dayAppointments.map(
          appt => (
            <div
  key={appt.id}
  className={`week-appointment ${
    getStatusClass(
      appt.status
    )
  }`}
  style={(() => {

    const startMinutes =
      convertTimeToMinutes(
        appt.appointment_time
      );

    const endMinutes =
      convertTimeToMinutes(
        appt.appointment_end_time
      );

    const clinicStart =
      7 * 60;

    const slotHeight =
      44;

    const top =
      (
        (
          startMinutes -
          clinicStart
        ) / 60
      ) * slotHeight;

    const height =
      Math.max(
        (
          (
            endMinutes -
            startMinutes
          ) / 60
        ) * slotHeight,
        40
      );

    return {
      top: `${top}px`,
      height: `${height}px`
    };

  })()}
  onClick={() => {

  setSelectedAppointment(
    appt
  );

  loadAppointmentServices(
    appt.id
  );

}}
>
  <strong>
  {appt.appointment_time}
</strong>

<div>
  {appt.patient?.full_name ||
   appt.guest_name}
</div>

<div>
  {appt.service?.name}
</div>
</div>
          )
        )}

      </div>
    );
  })}

</div>
            </div>
          </div>
        )}

        {view === "day" && (
  <div className="day-grid">

    {filteredAppointments
  .filter(appt => {

        const selectedDate =
          `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, "0")}-${String(
            currentDate.getDate()
          ).padStart(2, "0")}`;

        return (
          appt.appointment_date ===
          selectedDate
        );
      })
      .map(appt => (
        <div
  key={appt.id}
  className={`hour-row ${
  getStatusClass(
    appt.status
  )
}`}
  onClick={() => {

  setSelectedAppointment(
    appt
  );

  loadAppointmentServices(
    appt.id
  );

}}
>
          <strong>
  {appt.appointment_time}
</strong>

{" - "}

{
  appt.patient?.full_name ||
  appt.guest_name
}

{" - "}

{
  appt.service?.name ||
  "Service"
}
        </div>
      ))
    }

  </div>
)}
{selectedAppointment && (
  <div className="appointment-modal-overlay">
    <div className="appointment-modal">
      <div className="modal-header">
        <h2>Appointment Details</h2>
      </div>

      <div className="modal-layout">
        <div className="modal-left">
          <div className="detail-item">
            <span className="detail-label">Patient</span>
            <span className="detail-value">
              {selectedAppointment.patient?.full_name || selectedAppointment.guest_name}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">
              {selectedAppointment.patient?.email || selectedAppointment.guest_email || "N/A"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Contact Number</span>
            <span className="detail-value">
              {selectedAppointment.patient?.contact_number || selectedAppointment.guest_contact}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Dentist</span>
            <span className="detail-value">
              {selectedAppointment.dentist?.full_name}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Date</span>
            <span className="detail-value">
              {selectedAppointment.appointment_date}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Time</span>
            <span className="detail-value">
              {selectedAppointment.appointment_time}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Additional Notes</span>
            <span className="detail-value">
              {selectedAppointment.notes || "No notes provided"}
            </span>
          </div>
        </div>

        <div className="modal-right">
          {!selectedAppointment.patient_id && (
            <div className="detail-item">
              <span className="guest-badge">
                Guest Booking
              </span>
            </div>
          )}

          <div className="detail-item">
            <span className="detail-label">Status</span>
            <span
            className={`status-pill ${
            selectedAppointment.status === "cancelled" &&
            selectedAppointment.rejection_reason
            ? "rejected"
            : getStatusClass(selectedAppointment.status)
            }`}
            >
  {
    selectedAppointment.status === "cancelled" &&
    selectedAppointment.rejection_reason
      ? "Rejected"
      : selectedAppointment.status?.replaceAll("_", " ")
  }
</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Payment Status</span>
            <span className="detail-value">
              {selectedAppointment.payment_status}
            </span>

            {selectedAppointment.receipt_url && (
              <a
                href={
                  supabase.storage
                    .from("receipts")
                    .getPublicUrl(selectedAppointment.receipt_url)
                    .data.publicUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="receipt-link"
              >
                📄 View Downpayment Receipt
              </a>
            )}

            <a
              href="#"
              className="receipt-link"
              onClick={(e) => {
                e.preventDefault();

                localStorage.setItem(
                  "highlightPaymentId",
                  selectedAppointment.id
                );

                navigate("/payments");
              }}
            >
              💳 View Payment Details
            </a>
          </div>

          <div className="detail-item">
            <span className="detail-label">Payment Method</span>
            <span className="detail-value">
              {selectedAppointment.payment_method}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Reason for Visit</span>
            <span className="detail-value">
              {selectedAppointment.reason_for_visit || "Not provided"}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-item services-calendar-section">
        <span className="detail-label">Services Availed</span>

        <div className="services-list">
          {appointmentServices
  .filter(
    service =>
      service.service_status !==
      "not_performed"
  )
  .length > 0 ? (

  appointmentServices
    .filter(
      service =>
        service.service_status !==
        "not_performed"
    )
    .map((service) => (
              <div key={service.id} className="service-item">
                <span>{service.service_name}</span>

                <strong>
                  ₱{Number(service.price).toLocaleString()}
                </strong>
              </div>
            ))
          ) : (
            <span className="detail-value">
              No services found
            </span>
          )}
        </div>
      </div>

      <div className="appointment-modal-actions">
        {selectedAppointment.status === "pending_verification" && (
<>
  <button
    className="btn-confirm-payment"
    onClick={async () => {
      try {
        await confirmDownpaymentApi(
          selectedAppointment.id
        );

        fetchAppointments();
        setSelectedAppointment(null);
      }
      catch(err){
        console.error(err);
      }
    }}
  >
    Confirm Payment
  </button>

  <button
  className="btn-reject-booking"
  onClick={() =>
  {
    console.log("REJECT CLICKED");
    setShowRejectModal(true);
  }}
>
  Reject Booking
</button>
</>
)}

        {selectedAppointment.status === "scheduled" && (
          <>
  <button
    className="btn-done"
    onClick={markAsDone}
  >
    Mark as Done
  </button>

  <button
    className="btn-no-show"
    onClick={markAsNoShow}
  >
    No Show
  </button>

  <button
    className="btn-cancel-b"
    onClick={cancelAppointment}
  >
    Cancel
  </button>

  <button
    className="btn-reschedule"
    onClick={async () =>
{
  const response =
    await getAppointmentServicesApi(
      selectedAppointment.id
    );

  setAppointmentServices(
    response.services || []
  );

  setNewDate(
    selectedAppointment.appointment_date
  );

  setNewTime("");

  setShowReschedule(true);
}}
  >
    Reschedule
  </button>
</>
        )}

        {
showRejectModal && (

<div className="appointment-modal-overlay">

  <div className="reject-modal">

    <div className="reject-header">
  <h2>
    Reject Booking
  </h2>

  <p className="reject-description">
    Select the reason for rejecting this appointment.
  </p>
</div>

    <div className="reject-body">

  <div className="reject-field">

    <label>
      Reason for Rejection
    </label>


      <select
        value={rejectReason}
        onChange={(e) =>
          setRejectReason(
            e.target.value
          )
        }
      >
        <option value="">
          Select Reason
        </option>

        <option value="Fake Receipt">
          Fake Receipt
        </option>

        <option value="Wrong Amount">
          Wrong Amount
        </option>

        <option value="Duplicate Booking">
          Duplicate Booking
        </option>

        <option value="Spam Booking">
          Spam Booking
        </option>

        <option value="Other">
          Other
        </option>

      </select>

    </div>
    </div>

    <div className="reject-actions">

      <button
  className="btn-reject-booking"
  onClick={() =>
  {
    console.log(
      "CONFIRM REJECT CLICKED"
    );

    console.log(
      "SELECTED APPOINTMENT:",
      selectedAppointment
    );

    console.log(
      "REJECT REASON:",
      rejectReason
    );

    rejectBooking();
  }}
>
  Confirm Reject
</button>

      <button
        className="modal-close-btn"
        onClick={() =>
        {
          setShowRejectModal(false);
          setRejectReason("");
        }}
      >
        Cancel
      </button>

    </div>

  </div>

</div>

)}

        {
  selectedAppointment.status === "cancelled" &&
  !selectedAppointment.rejection_reason && (
    <button
      className="btn-incomplete"
      onClick={undoCancel}
    >
      Undo Cancel
    </button>
  )
}

        {
        selectedAppointment.status === "cancelled" &&
        selectedAppointment.rejection_reason && (
  <button
    className="btn-incomplete"
    onClick={async () =>
    {
      try
      {
        await confirmDownpaymentApi(
          selectedAppointment.id
        );

        await fetchAppointments();

        setSelectedAppointment(
          null
        );
      }
      catch(error)
      {
        console.error(error);
      }
    }}
  >
    Undo Rejection
  </button>
)}

        {selectedAppointment.status === "completed" && (
          <button className="btn-incomplete" onClick={markAsIncomplete}>
            Mark as Incomplete
          </button>
        )}

        {selectedAppointment.status === "no_show" && (
          <button className="btn-incomplete" onClick={undoNoShow}>
            Undo No Show
          </button>
        )}

        <button
          className="modal-close-btn"
          onClick={() => setSelectedAppointment(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

        {
showReschedule && (

<div
  className="appointment-modal-overlay"
>
  <div className="reject-modal">

    <div className="modal-header">
      <h2>
        Reschedule Appointment
      </h2>
    </div>

    <div className="modal-body">

      <div className="detail-item">

        <span className="detail-label">
          New Date
        </span>

        <input
          type="date"
          value={newDate}
          onChange={(e) =>
            setNewDate(
              e.target.value
            )
          }
        />

      </div>

      <div className="detail-item">

        <span className="detail-label">
          New Time
        </span>

        <select
  value={newTime}
  onChange={(e) =>
    setNewTime(e.target.value)
  }
>
  <option value="">
    Select Time
  </option>

  {availableSlots.map(slot => (
    <option
      key={slot}
      value={slot}
    >
      {slot}
    </option>
  ))}
</select>

      </div>

    </div>

    <div className="appointment-modal-actions">

      <button
        className="btn-reschedule"
        onClick={
          handleReschedule
        }
      >
        Save
      </button>

      <button
        className="modal-close-btn"
        onClick={() =>
          setShowReschedule(false)
        }
      >
        Cancel
      </button>

    </div>

  </div>

</div>

)}

      </div>
    </div>
  );
}

export default Calendar;