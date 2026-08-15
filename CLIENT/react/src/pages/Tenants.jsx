import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  readAllRooms,
  readAllTenantsForRoom,
  createTenant,
  editTenant,
  deleteTenant,
} from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";

export default function Tenants() {
  const { accessToken } = useAuth();
  const [rooms, setRooms] = useState({});
  const [selectedRoomId, setSelectedRoomId] = useState(
    localStorage.getItem("liparentSelectedRoomId") || ""
  );
  const [selectedRoomNumber, setSelectedRoomNumber] = useState(
    localStorage.getItem("liparentSelectedRoomNumber") || ""
  );
  const [tenants, setTenants] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId") || "";
  const selectedPropertyName = localStorage.getItem("liparentSelectedPropertyName") || "";

  // Create tenant modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    tenantName: "",
    tenantNationalID: "",
    tenantPhone: "",
    tenantMoveIn: "",
  });

  // Edit tenant modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editedTenant, setEditedTenant] = useState({
    tenantName: "",
    tenantNationalID: "",
    tenantPhone: "",
    tenantMoveIn: "",
    tenantMoveOut: "",
  });

  useEffect(() => {
    if (!accessToken || !selectedPropertyId) return;

    const loadRooms = async () => {
      const result = await readAllRooms(accessToken, selectedPropertyId);
      if (result.propertyRooms) setRooms(result.propertyRooms);
      if (result.error) setError(result.error);
    };

    loadRooms();
  }, [accessToken, selectedPropertyId]);

  useEffect(() => {
    if (!accessToken || !selectedPropertyId || !selectedRoomId) return;

    const loadTenants = async () => {
      const result = await readAllTenantsForRoom(
        accessToken,
        selectedPropertyId,
        selectedRoomId
      );
      if (result.selectedRoomOnPropertyTenants) {
        setTenants(result.selectedRoomOnPropertyTenants);
      }
      if (result.message) setMessage(result.message);
      if (result.error) setError(result.error);
    };

    loadTenants();
  }, [accessToken, selectedPropertyId, selectedRoomId]);

  const handleRoomSelect = (e) => {
    const roomId = e.target.value;
    setSelectedRoomId(roomId);

    if (roomId && rooms[roomId]) {
      const roomNumber = rooms[roomId].roomNumber;
      setSelectedRoomNumber(roomNumber);
      localStorage.setItem("liparentSelectedRoomId", roomId);
      localStorage.setItem("liparentSelectedRoomNumber", roomNumber);
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedRoomId) {
      setError("please select a room");
      return;
    }

    if (
      !confirm(`Do you want to add ${newTenant.tenantName} to roomID: ${selectedRoomId}?`)
    )
      return;

    const result = await createTenant(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      newTenant
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.newRoomTenants && result.message) {
      setMessage(result.message);
      setTenants(result.newRoomTenants);
      setShowCreateModal(false);
      setNewTenant({
        tenantName: "",
        tenantNationalID: "",
        tenantPhone: "",
        tenantMoveIn: "",
      });
    }
  };

  const handleEditTenant = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!editingTenant) return;

    if (
      !confirm(
        `Do you want to edit tenant with ID: "${editingTenant.tenantID}" on roomID: "${selectedRoomId}"?`
      )
    )
      return;

    const result = await editTenant(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      editingTenant.tenantID,
      editedTenant
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.editedRoomTenants && result.message) {
      setMessage(result.message);
      setTenants(result.editedRoomTenants);
      setShowEditModal(false);
      setEditingTenant(null);
    }
  };

  const handleDeleteTenant = async (tenant) => {
    setError("");
    setMessage("");

    if (
      !confirm(
        `Do you want to delete tenant with ID: "${tenant.tenantID}" from roomID: "${selectedRoomId}"?`
      )
    )
      return;

    const result = await deleteTenant(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      tenant.tenantID
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.deletedRoomTenants && result.message) {
      setMessage(result.message);
      setTenants(result.deletedRoomTenants);
    }
  };

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setEditedTenant({
      tenantName: tenant.tenantName,
      tenantNationalID: tenant.tenantNationalID,
      tenantPhone: tenant.tenantPhone,
      tenantMoveIn: tenant.tenantMoveIn,
      tenantMoveOut: tenant.tenantMoveOut || "",
    });
    setShowEditModal(true);
  };

  const reversedTenantKeys = Object.keys(tenants).reverse();

  return (
    <div className="home container-fluid font-italic">
      <Header showPropertySelector>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mr-2 w-100 d-flex justify-content-center align-items-center"
        >
          <div className="form-group d-flex w-100">
            <select
              className="form-control border border-right-0 border-left border-top-0 border-bottom"
              value={selectedRoomId}
              onChange={handleRoomSelect}
            >
              <option value="">SELECT ROOM</option>
              {Object.keys(rooms).map((key) => (
                <option key={key} value={key}>
                  {rooms[key].roomNumber.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn border border-right border-left-0 border-top-0 border-bottom text-success"
            >
              <i className="fa fa-search"></i>
            </button>
          </div>
        </form>
      </Header>

      <div className="hero mt-5 d-flex flex-column container-fluid text-center">
        <div className="first d-flex justify-content-between mb-2">
          <div className="text-left w-25">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-success"
            >
              ADD TENANT
            </button>
          </div>
          <div className="text-center w-75">
            <u>
              <h2>
                {selectedRoomNumber && selectedPropertyName
                  ? `TENANTS FOR ${selectedRoomNumber} IN ${selectedPropertyName.toUpperCase()}`
                  : "TENANTS"}
              </h2>
            </u>
          </div>
        </div>

        {error && <div className="alert alert-danger alert-dismissible fade show">{error}
           <button onClick={() => setError("")} type="button" className="close" data-dismiss="alert">
            <span>&times;</span>
          </button></div>}
        {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button onClick={() => setMessage("")} type="button" className="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>}

        <div className="overflow-auto pt-0">
          <table className="table table-active bg-white mt-2">
            <thead className="position-sticky bg-white">
              <tr>
                <th>NO.</th>
                <th>TENANT ID</th>
                <th>TENANT NAME</th>
                <th>TENANT NATIONAL ID</th>
                <th>TENANT PHONE</th>
                <th>TENANT MOVE IN</th>
                <th>TENANT MOVE OUT</th>
                <th>TENANT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {reversedTenantKeys.map((key, index) => {
                const tenant = tenants[key];
                return (
                  <tr
                    key={key}
                    className={tenant.tenantMoveOut ? "table-active" : ""}
                  >
                    <td>{index + 1}</td>
                    <td>{tenant.tenantID}</td>
                    <td>{tenant.tenantName}</td>
                    <td>{tenant.tenantNationalID}</td>
                    <td>{tenant.tenantPhone}</td>
                    <td>{new Date(tenant.tenantMoveIn).toDateString()}</td>
                    <td>
                      {tenant.tenantMoveOut
                        ? new Date(tenant.tenantMoveOut).toDateString()
                        : ""}
                    </td>
                    <td>
                      <button
                        onClick={() => openEditModal(tenant)}
                        className="btn btn-primary mr-2 edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant)}
                        className="btn btn-danger ml-2 delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />

      {showCreateModal && (
        <Modal title="ADD TENANT TO ROOM" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateTenant} className="form">
            <div className="form-group">
              <label className="font-weight-bold">TENANT NAME</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={newTenant.tenantName}
                onChange={(e) => setNewTenant({ ...newTenant, tenantName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT NATIONAL ID</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={newTenant.tenantNationalID}
                onChange={(e) => setNewTenant({ ...newTenant, tenantNationalID: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT PHONE</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={newTenant.tenantPhone}
                onChange={(e) => setNewTenant({ ...newTenant, tenantPhone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT MOVE IN</label>
              <input
                type="date"
                className="form-control text-uppercase"
                value={newTenant.tenantMoveIn}
                onChange={(e) => setNewTenant({ ...newTenant, tenantMoveIn: e.target.value })}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                ADD TENANT
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && editingTenant && (
        <Modal title="EDIT TENANT" onClose={() => setShowEditModal(false)}>
          <h5 className="text-center">
            Tenant Id:{" "}
            <span className="font-weight-light">{editingTenant.tenantID}</span>
          </h5>
          <form onSubmit={handleEditTenant} className="form">
            <div className="form-group">
              <label className="font-weight-bold">TENANT NAME</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedTenant.tenantName}
                onChange={(e) => setEditedTenant({ ...editedTenant, tenantName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT NATIONAL ID</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedTenant.tenantNationalID}
                onChange={(e) => setEditedTenant({ ...editedTenant, tenantNationalID: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT PHONE</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedTenant.tenantPhone}
                onChange={(e) => setEditedTenant({ ...editedTenant, tenantPhone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT MOVE IN DATE</label>
              <input
                type="date"
                className="form-control text-uppercase"
                value={editedTenant.tenantMoveIn}
                onChange={(e) => setEditedTenant({ ...editedTenant, tenantMoveIn: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">TENANT MOVE OUT DATE</label>
              <input
                type="date"
                className="form-control text-uppercase"
                value={editedTenant.tenantMoveOut}
                onChange={(e) => setEditedTenant({ ...editedTenant, tenantMoveOut: e.target.value })}
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-primary w-100">
                EDIT TENANT
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}