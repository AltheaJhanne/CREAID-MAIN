import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "../styles/users.css";
import {
  getUsersApi,
  archiveUserApi,
  restoreUserApi,
  updateUserApi
} from "../api/users";

const PAGE_SIZE = 5;

function Userlist() {

  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);

  // FILTER INPUTS
  const [filters, setFilters] = useState({
    name: "",
    year: "",
    type: "",
    tags: ""
  });

  // APPLIED FILTERS
  const [appliedFilters, setAppliedFilters] = useState({
    name: "",
    year: "",
    type: "",
    tags: ""
  });

  // EDIT MODAL
  const [editingUser, setEditingUser] = useState(null);

  const [editForm, setEditForm] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    address: "",
    contact_number: "",
    role: ""
  });

  useEffect(() => {
    fetchUsers();
  }, [page, appliedFilters, showArchived]);

  async function fetchUsers() {

  try {

    const result =
      await getUsersApi({

        page,

        archived:
          showArchived,

        name:
          appliedFilters.name,

        role:
          appliedFilters.type,

        year:
          appliedFilters.year,
      });

    const formattedUsers =
      result.users.map((u) => ({

        id: u.id,
        
        role: u.role,

        first_name:
          u.first_name,

        middle_name:
          u.middle_name,

        last_name:
          u.last_name,

        name:
          `${u.last_name},
           ${u.first_name}
           ${u.middle_name || ""}`,

        address:
          u.address,

        mobile:
          u.contact_number,

        created:
          new Date(
            u.created_at
          ).toLocaleDateString(),

        lastOnline:
          "Online",

        balance:
          "₱0.00"
      }));

    setUsers(formattedUsers);

    setTotalUsers(
      result.total
    );

  } catch (error) {

    console.error(
      "Fetch users error:",
      error
    );

    alert(error.message);
  }
}

  // APPLY FILTERS
  function handleGo() {
    setPage(1);
    setAppliedFilters({ ...filters });
  }

  // CLEAR FILTERS
  function handleClear() {

    const empty = {
      name: "",
      year: "",
      type: "",
      tags: ""
    };

    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
  }

  // ARCHIVE USER
async function archiveUser(id) {

  const confirmArchive =
    window.confirm(
      "Archive this user?"
    );

  if (!confirmArchive) return;

  try {

    await archiveUserApi(id);

    // REMOVE USER FROM CURRENT UI
    setUsers((prev) =>
      prev.filter(
        (u) => u.id !== id
      )
    );

    // UPDATE TOTAL
    setTotalUsers((prev) =>
      prev - 1
    );

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}

  // RESTORE USER
 async function restoreUser(id) {

  const confirmRestore =
    window.confirm(
      "Restore this user?"
    );

  if (!confirmRestore) return;

  try {

    await restoreUserApi(id);

    // REMOVE FROM ARCHIVED UI
    setUsers((prev) =>
      prev.filter(
        (u) => u.id !== id
      )
    );

    // UPDATE TOTAL
    setTotalUsers((prev) =>
      prev - 1
    );

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}

  // OPEN EDIT MODAL
  function editUser(user) {

    setEditingUser(user);

    setEditForm({
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      address: user.address || "",
      contact_number: user.mobile || "",
      role: user.role || ""
    });
  }

  // SAVE EDIT
  async function saveEditUser() {

  try {

    await updateUserApi(
      editingUser.id,
      {
        first_name:
          editForm.first_name,

        middle_name:
          editForm.middle_name,

        last_name:
          editForm.last_name,

        address:
          editForm.address,

        contact_number:
          editForm.contact_number,

        role:
          editForm.role
      }
    );

    setEditingUser(null);

    await fetchUsers();

  } catch (error) {

    console.error(error);

    alert(error.message);
  }
}

  const totalPages =
    Math.ceil(totalUsers / PAGE_SIZE);

  return (
    <div className="admin-container">

      <Sidebar />

      <div className="admin-main">

        <Topbar />

        <div className="dashboard-content">

          {/* HEADER */}
          <div className="users-page-header">

            <div>
              <h2>
                {showArchived
                  ? "Archived Users"
                  : "Users List"}
              </h2>
            </div>

            <button
  className="btn-go"
  onClick={() => {

    setPage(1);

    setShowArchived(
      !showArchived
    );
  }}
>
  {showArchived
    ? "Show Active Users"
    : "Show Archived Users"}
</button>

          </div>

          <div className="users-page-container">

            {/* FILTERS */}
            <div className="users-filter-container">

              <div className="filter-left">

                {/* ROW 1 */}
                <div className="filter-row">

                  <span className="filter-label">
                    Filter by
                  </span>

                  <input
                    type="text"
                    placeholder="Lastname, Firstname"
                    value={filters.name}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        name: e.target.value
                      })
                    }
                  />

                </div>

                {/* ROW 2 */}
                <div className="filter-row">

                  <span className="filter-label">
                    Patient of
                  </span>

                  <input
                    type="text"
                    placeholder="Year"
                    value={filters.year}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value
                      })
                    }
                  />

                  <select
                    value={filters.type}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        type: e.target.value
                      })
                    }
                  >
                    <option value="">Type</option>
                    <option value="Patient">Patient</option>
                    <option value="Staff">Staff</option>
                    <option value="Dentist">Dentist</option>
                  </select>

                  <button
                    className="btn-go"
                    onClick={handleGo}
                  >
                    Go
                  </button>

                  <button
                    className="btn-clear"
                    onClick={handleClear}
                  >
                    Clear
                  </button>

                </div>

              </div>

              {/* RIGHT */}
              <div className="filter-right">

                <span className="filter-label">
                  Filter by Tags
                </span>

                <input
                  type="text"
                  placeholder="Search tags..."
                  value={filters.tags}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      tags: e.target.value
                    })
                  }
                />

              </div>

            </div>

            {/* TABLE */}
            <div className="users-table">

              <div className="users-table-header">
                <span></span>
                <span>ID</span>
                <span>Name</span>
                <span>Address</span>
                <span>Mobile</span>
                <span>Account Created</span>
                <span>Last Online</span>
                <span>Balance</span>
              </div>

              {users.length === 0 ? (

                <div className="users-empty">
                  No users found.
                </div>

              ) : (

                users.map((u, i) => (

                  <div key={u.id} className="users-table-row">

                    <div className="row-actions">

                      <button
                        onClick={() => editUser(u)}
                      >
                        ✏️
                      </button>

                      {showArchived ? (

                        <button
                          onClick={() =>
                            restoreUser(u.id)
                          }
                        >
                          ↩️
                        </button>

                      ) : (

                        <button
                          onClick={() =>
                            archiveUser(u.id)
                          }
                        >
                          🗑️
                        </button>

                      )}

                    </div>

                    <span>{u.id}</span>
                    <span className="link">
                      {u.name}
                    </span>
                    <span>{u.address}</span>
                    <span>{u.mobile}</span>
                    <span>{u.created}</span>
                    <span>{u.lastOnline}</span>
                    <span>{u.balance}</span>

                  </div>

                ))
              )}

            </div>

            {/* FOOTER */}
            <div className="users-footer">

              <div className="pagination">

                <span
                  className={
                    page === 1
                      ? "pagination-disabled"
                      : "pagination-btn"
                  }
                  onClick={() =>
                    page > 1 &&
                    setPage(page - 1)
                  }
                >
                  « Previous
                </span>

                <strong>{page}</strong>

                <span
                  className={
                    page >= totalPages
                      ? "pagination-disabled"
                      : "pagination-btn"
                  }
                  onClick={() =>
                    page < totalPages &&
                    setPage(page + 1)
                  }
                >
                  Next »
                </span>

              </div>

              <div>
                Total Users: {totalUsers}
              </div>

            </div>

          </div>

          {/* EDIT MODAL */}
          {editingUser && (

            <div className="edit-modal-overlay">

              <div className="edit-modal">

                <h3>Edit User</h3>

                <label>First Name</label>

                <input
                  value={editForm.first_name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      first_name: e.target.value
                    })
                  }
                />

                <label>Middle Name</label>

                <input
                  value={editForm.middle_name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      middle_name: e.target.value
                    })
                  }
                />

                <label>Last Name</label>

                <input
                  value={editForm.last_name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      last_name: e.target.value
                    })
                  }
                />

                <label>Address</label>

                <input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      address: e.target.value
                    })
                  }
                />

                <label>Contact Number</label>

                <input
                  value={editForm.contact_number}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      contact_number: e.target.value
                    })
                  }
                />

              <label>Role</label>

<select
  value={editForm.role}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      role: e.target.value
    })
  }
>
  <option
  value="admin"
  disabled={
    editingUser.email ===
    "admin@gmail.com"
      ? false
      : false
  }
>
  Admin
</option>

  <option value="staff">
    Staff
  </option>

  <option value="dentist">
    Dentist
  </option>

  <option value="patient">
    Patient
  </option>
</select>

                <div className="edit-modal-actions">

                  <button
                    className="btn-clear"
                    onClick={() =>
                      setEditingUser(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="btn-go"
                    onClick={saveEditUser}
                  >
                    Save Changes
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

export default Userlist;