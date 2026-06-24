import { useEffect, useState } from "react";
import "../styles/payment.css";
import {
  getPaymentsApi,
  getAppointmentServicesApi,
  markPaymentPaidApi,
  cancelPaymentApi,
  undoPaymentPaidApi,
  reinstatePaymentApi,
  addServiceToPaymentApi,
  markServiceNotPerformedApi,
  markServicePerformedApi
}
from "../api/appointments";

import {
  getServicesApi
}
from "../api/services";

import axios from "axios";

function Payment() 
{
  const [payments, setPayments] = useState([]);
  const [highlightedId, setHighlightedId] =
useState(
  localStorage.getItem(
    "highlightPaymentId"
  )
);
const [showReceipt, setShowReceipt] =
  useState(false);
const [clinicFilter, setClinicFilter] = useState("All");
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [services, setServices] = useState([]);
  const [viewingPayment, setViewingPayment] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [sortBy, setSortBy] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() =>
{
  loadPayments();
  loadServices();
}, []);


async function handleMarkPaid()
{
  try
  {
    await markPaymentPaidApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleCancelPayment()
{
  try
  {
    await cancelPaymentApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleNotPerformed(service)
{
  try
  {
    await markServiceNotPerformedApi(service.id);

    const updatedPayments =
      await loadPayments();

    const updatedPayment =
      updatedPayments.find(
        p => p.id === editingPayment.id
      );

    if(updatedPayment)
    {
      await handleEdit(updatedPayment);
    }
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handlePerformed(
  service
)
{
  try
  {
    await markServicePerformedApi(
      service.id
    );

    await handleEdit(
      editingPayment
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

async function loadPayments()
{
  try
  {
    const response =
      await getPaymentsApi();

    const list =
      response.payments || [];

    console.log(
      "STATUSES:",
      list.map(
        p => p.payment_status
      )
    );

    setPayments(list);

    return list;
  }
  catch(error)
  {
    console.error(error);

    return [];
  }
}

const filteredPayments =
  payments.filter(payment =>
  {
    if(
      clinicFilter !== "All" &&
      payment.branch_id !== clinicFilter
    )
    {
      return false;
    }
    const search =
      searchTerm.toLowerCase();

    const matchesSearch =
      payment.guest_name
        ?.toLowerCase()
        .includes(search)
      ||
      payment.payment_method
        ?.toLowerCase()
        .includes(search)
      ||
      payment.payment_status
      ?.toLowerCase()
      .includes(search)
      ||
      payment.status
      ?.toLowerCase()
      .includes(search);

    if(!matchesSearch)
    {
      return false;
    }

    switch(sortBy)
    {
      case "today":
        return (
          payment.appointment_date ===
          new Date()
            .toISOString()
            .split("T")[0]
        );

      case "pending":
        return (
          payment.remaining_balance > 0 &&
          payment.status !== "cancelled" &&
          payment.status !== "rejected" &&
          payment.status !== "no_show"
        );

      case "paid":
        return (
          payment.payment_status
            ?.toLowerCase() ===
          "paid"
        );

      case "cancelled":
  return (
    payment.payment_status
      ?.toLowerCase() ===
    "cancelled"
    ||
    payment.status
      ?.toLowerCase() ===
    "rejected"
  );

      default:
        return true;
    }
  });

async function loadServices()
{
  try
  {
    const response =
      await axios.get(
        `${import.meta.env.VITE_API_URL}/services`
      );

    setAllServices(
      response.data.services || []
    );
  }
  catch(error)
  {
    console.error(error);
  }
}

  async function handleEdit(p)
{
  setEditingPayment(p);
  setEditForm({ ...p });

  try
  {
    const response =
      await getAppointmentServicesApi(
        p.id
      );

    console.log(
      "SERVICES:",
      response.services
    );

    console.log(
  "EDIT PAYMENT:",
  p
);

    setServices(
      response.services || []
    );
  }
  catch(error)
  {
    console.error(error);

    setServices([]);
  }
}

function handleGenerateInvoice()
{
  const invoiceWindow =
    window.open(
      "",
      "_blank"
    );

  const invoiceHtml = `
    <html>
      <head>
        <title>Invoice</title>

        <style>
          body{
            font-family: Arial;
            padding:40px;
          }

          h1{
            color:#14093e;
          }

          table{
            width:100%;
            border-collapse:collapse;
            margin-top:20px;
          }

          th,td{
            border:1px solid #ddd;
            padding:10px;
            text-align:left;
          }

          .total{
            margin-top:20px;
            font-size:18px;
            font-weight:bold;
          }
        </style>
      </head>

      <body>

        <h1>JUANA SMILE DENTAL CLINIC</h1>

        <p>Official Invoice</p>
        <hr>
        <p>
  <strong>Invoice #:</strong>
  ${editForm.invoice_number || "N/A"}
</p>
        <p>
          <strong>Patient:</strong>
          ${editForm.guest_name}
        </p>

        <p>
          <strong>Clinic:</strong>
          ${editForm.branch_id}
        </p>

        <p>
          <strong>Date:</strong>
          ${editForm.appointment_date}
        </p>

        <p>
          <strong>Payment Method:</strong>
          ${editForm.payment_method}
        </p>

        <p>
          <strong>Status:</strong>
          ${editForm.payment_status}
        </p>

        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Amount</th>
            </tr>
          </thead>

          <tbody>

            ${services.map(service => `
              <tr>
                <td>
                  ${service.service_name}
                </td>

                <td>
                  ₱${Number(
                    service.price
                  ).toLocaleString()}
                </td>
              </tr>
            `).join("")}

          </tbody>
        </table>

        <p class="total">
          Total:
          ₱${Number(
            editForm.total_amount || 0
          ).toLocaleString()}
        </p>

        <p>
          Amount Paid:
          ₱${Number(
            editForm.amount_paid || 0
          ).toLocaleString()}
        </p>

        <p>
          Remaining Balance:
          ₱${Number(
            editForm.remaining_balance || 0
          ).toLocaleString()}
        </p>

      </body>
    </html>
  `;

  invoiceWindow.document.write(
    invoiceHtml
  );

  invoiceWindow.document.close();

  invoiceWindow.print();
}

function handleGenerateOfficialReceipt()
{
  const receiptWindow =
    window.open(
      "",
      "_blank"
    );

  const receiptHtml = `
    <html>
      <head>
        <title>
          Official Receipt
        </title>

        <style>
          body{
            font-family:Arial;
            padding:40px;
          }

          h1{
            color:#14093e;
          }

          .receipt-box{
            border:2px solid #14093e;
            padding:25px;
            border-radius:12px;
          }

          .amount{
            font-size:24px;
            font-weight:bold;
            margin-top:15px;
          }
        </style>
      </head>

      <body>

        <div class="receipt-box">

          <h1>
            JUANA SMILE DENTAL CLINIC
          </h1>

          <h2>
            OFFICIAL RECEIPT
          </h2>

          <hr>

          <p>
            <strong>Receipt No:</strong>
            OR-${Date.now()}
          </p>

          <p>
            <strong>Patient:</strong>
            ${editForm.guest_name}
          </p>

          <p>
            <strong>Branch:</strong>
            ${editForm.branch_id}
          </p>

          <p>
            <strong>Date Paid:</strong>
            ${new Date().toLocaleDateString()}
          </p>

          <p>
            <strong>Payment Method:</strong>
            ${editForm.payment_method}
          </p>

          <div class="amount">
            Amount Received:
            ₱${Number(
              editForm.total_amount || 0
            ).toLocaleString()}
          </div>

          <br>

          <p>
            Payment received in full
            for dental services rendered.
          </p>

          <br><br>

          <p>
            _______________________
          </p>

          <p>
            Authorized Signature
          </p>

        </div>

      </body>
    </html>
  `;

  receiptWindow.document.write(
    receiptHtml
  );

  receiptWindow.document.close();

  receiptWindow.print();
}

  function handleSave() 
  {
    setPayments(payments.map(p => p.id === editingPayment.id ? { ...editForm } : p));
    setEditingPayment(null);
    setEditForm({});
  }

  function handleCancel() {
  setEditingPayment(null);
  setEditForm({});
  setServices([]);
}

async function handleUndoPaid()
{
  try
  {
    await undoPaymentPaidApi(
      editingPayment.id
    );

    const updatedPayments =
      await loadPayments();

    const updatedPayment =
      updatedPayments.find(
        p =>
          p.id ===
          editingPayment.id
      );

    if(updatedPayment)
    {
      setEditingPayment(
        updatedPayment
      );

      setEditForm(
        updatedPayment
      );
    }
  }
  catch(error)
  {
    console.error(error);
  }
}

async function handleReinstate()
{
  try
  {
    await reinstatePaymentApi(
      editingPayment.id
    );

    await loadPayments();

    handleCancel();
  }
  catch(error)
  {
    console.error(error);
  }
}

  return (
    <div className="users-content">
      <div className="users-page-header">
        <h2>Payment</h2>
      </div>

      <div className="users-page-container">

      <div className="payment-toolbar">

  <input
    type="text"
    className="payment-search-input"
    placeholder="Search patient, payment method, or status..."
    value={searchTerm}
    onChange={(e) =>
      setSearchTerm(e.target.value)
    }
  />

  <select
  className="payment-clinic-filter"
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

  <div className="payment-filters">

  {[
  "all",
  "today",
  "pending",
  "paid",
  "cancelled"
].map(filter => (

    <button
      key={filter}
      className={
        sortBy === filter
          ? "active"
          : ""
      }
      onClick={() =>
        setSortBy(filter)
      }
    >
      {
        filter.charAt(0)
        .toUpperCase()
        +
        filter.slice(1)
      }
    </button>

  ))}

</div>
</div>
        <div className="payment-table">
          <div className="payment-table-header">
            <span>Name</span>
            <span>Clinic</span>
            <span>Invoice</span>
            <span>Amount</span>
            <span>Balance</span>
            <span>Mode of Payment</span>
            <span>Status</span>
            <span></span>
          </div>

          {payments.length === 0 ? (
            <div className="users-empty">No payments found.</div>
          ) : (
            filteredPayments.map((p) => (
              <div
  key={p.id}
  className={`payment-table-row ${
    highlightedId === p.id
      ? "highlight-payment"
      : ""
  }`}
>
                <span>{p.guest_name}</span>
                <span>{p.branch_id || "—"}</span>
                <span>
                {p.invoice_number || "-"}
                </span>
                <span>
                  ₱{
                  Number(
                    p.total_amount
                  ).toLocaleString()
                  }
                  </span>
                <span>
                  ₱{
                  Number(
                    p.remaining_balance
                  ).toLocaleString()
                  }
                  </span>
                <span>
                  {p.payment_method}
                  </span>
                <span
  className={`payment-status ${
    p.status === "cancelled" &&
    p.rejection_reason
      ? "payment-status-cancelled"
      : `payment-status-${p.payment_status?.toLowerCase()}`
  }`}
>
  {
    p.status === "cancelled" &&
    p.rejection_reason
    ? "Rejected"
    : p.payment_status
  }
</span>
                <span className="payment-row-actions">
                  <button
  className="btn-edit-icon"
  onClick={(e) => {

    e.stopPropagation();

    localStorage.removeItem(
      "highlightPaymentId"
    );

    setHighlightedId(null);

    handleEdit(p);
  }}
>
  ✏️
</button>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {editingPayment && (
  <div
    className="modal-overlay"
    onClick={handleCancel}
  >
    <div
  className="payment-modal"
  onClick={(e) => e.stopPropagation()}
>
      <div className="modal-header">
        <h3>Payment Details</h3>
      </div>

      <div className="modal-body">

        <div className="modal-field">
          <label>Patient</label>
          <p className="modal-readonly">
            {editForm.guest_name}
          </p>
        </div>

        <div className="modal-field">
          <label>Total Amount</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.total_amount || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
          <label>Amount Paid</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.amount_paid || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
          <label>Remaining Balance</label>
          <p className="modal-readonly">
            ₱{Number(
              editForm.remaining_balance || 0
            ).toLocaleString()}
          </p>
        </div>

        <div className="modal-field">
  <label>Mode of Payment</label>

  {editForm.status === "rejected" ? (

    <p className="modal-readonly">
      {editForm.payment_method}
    </p>

  ) : (

    <select
      className="modal-input"
      value={
        editForm.payment_method || ""
      }
      onChange={(e) =>
        setEditForm({
          ...editForm,
          payment_method:
            e.target.value
        })
      }
    >
      <option value="Cash">
        Cash
      </option>

      <option value="GCash">
        GCash
      </option>

      <option value="Card">
        Card
      </option>
    </select>

  )}
</div>

        <div className="modal-field">
  <label>Payment Status</label>

  <p
    className={`payment-status-display ${editForm.payment_status?.toLowerCase()}`}
  >
    {editForm.payment_status}
  </p>
</div>

        <div
          className="modal-field"
          style={{
            gridColumn: "1 / -1"
          }}
        >
          <label>
            Services Availed
          </label>

          <div className="services-list">

            {services.filter(
  service =>
    service.service_status !==
    "not_performed"
).length > 0 ? (

  services
    .filter(
      service =>
        service.service_status !==
        "not_performed"
    )
    .map((service) => (
                <div
                  key={service.id}
                  className="service-item"
                >
                  <span>
                    {service.service_name}
                  </span>

                  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" && (

<div className="service-actions">

  <strong>
    ₱{Number(
      service.price
    ).toLocaleString()}
  </strong>

  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" &&
 editForm.status !== "rejected" && (

    service.service_status === "not_performed" ? (

      <button
        className="btn-performed"
        onClick={() =>
          handlePerformed(service)
        }
      >
        Undo
      </button>

    ) : (

      <button
        className="btn-not-performed"
        onClick={() =>
          handleNotPerformed(service)
        }
      >
        Not Performed
      </button>

    )

  )}

</div>

)}
                </div>
              ))
            ) : (
              <p>
                No services found.
              </p>
            )}

          </div>
        </div>

      </div>


        <div className="modal-footer">

  {editForm.payment_status !== "cancelled" &&
 editForm.payment_status !== "paid" &&
 editForm.status !== "rejected" && (

<select
      className="modal-input"
      onChange={async (e) =>
      {
        if(!e.target.value)
        {
          return;
        }

        try
        {
          await addServiceToPaymentApi(
            editingPayment.id,
            e.target.value
          );

          await handleEdit(
            editingPayment
          );

          await loadPayments();
        }
        catch(error)
        {
          console.error(error);
        }
      }}
    >
      <option value="">
        + Add Service
      </option>

      {allServices.map(service => (

        <option
          key={service.id}
          value={service.id}
        >
          {service.name}
          {" - ₱"}
          {service.price}
        </option>

      ))}
    </select>

  )}

  {editForm.payment_status === "cancelled" ? (

  <button
    className="btn-reinstate"
    onClick={handleReinstate}
  >
    Reinstate Appointment
  </button>

) : (

  editForm.payment_status !== "paid" &&
  editForm.status !== "rejected" && (

    <button
      className="btn-cancel-payment"
      onClick={handleCancelPayment}
    >
      Cancel / No Show
    </button>

  )

)}

  {editForm.payment_status !== "cancelled" &&
 editForm.status !== "rejected" && (

    editForm.payment_status === "paid" ? (

      <button
        className="btn-warning"
        onClick={handleUndoPaid}
      >
        Undo Fully Paid
      </button>

    ) : (

      <button
        className="btn-save"
        onClick={handleMarkPaid}
      >
        Mark Fully Paid
      </button>

    )

  )}

  <button
  className="btn-save"
  onClick={() =>
    handleGenerateInvoice()
  }
>
  Generate Invoice
</button>

{editForm.payment_status === "paid" && (

  <button
    className="btn-save"
    onClick={() =>
      handleGenerateOfficialReceipt()
    }
  >
    Official Receipt
  </button>

)}

<button
  className="btn-save"
  onClick={() =>
    setShowReceipt(true)
  }
>
  View Dowmpayment Receipt
</button>

  <button
    className="btn-cancel-edit"
    onClick={handleCancel}
  >
    Close
  </button>

</div>

      </div>
      {showReceipt && (
  <div
    className="modal-overlay"
    onClick={() =>
      setShowReceipt(false)
    }
  >
    <div className="payment-modal receipt-modal"
      onClick={(e) =>
        e.stopPropagation()
      }
    >
      <div className="modal-header">
        <h3>Receipt Preview</h3>
      </div>

      <div
  className="modal-body"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "auto",
    maxHeight: "80vh",
    padding: "20px"
  }}
>

<img
  src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${editForm.receipt_url}`}
  alt="Receipt"
  onClick={() =>
    window.open(
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/receipts/${editForm.receipt_url}`,
      "_blank"
    )
  }
  style={{
    width: "auto",
    maxWidth: "100%",
    maxHeight: "75vh",
    objectFit: "contain",
    borderRadius: "10px",
    cursor: "zoom-in"
  }}
/>
      </div>

      <div className="modal-footer">
        <button
          className="btn-cancel-edit"
          onClick={() =>
            setShowReceipt(false)
          }
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
    </div>
)}
    </div>
  );
}

export default Payment;