import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  readAllTenantsForRoom,
  readAllTenantPayments,
  createPayment,
  editPayment,
  deletePayment,
} from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

export default function Rents() {
  const { accessToken } = useAuth();
  const [tenants, setTenants] = useState({});
  const [selectedTenantId, setSelectedTenantId] = useState(
    localStorage.getItem("liparentSelectedTenantId") || ""
  );
  const [selectedTenantName, setSelectedTenantName] = useState(
    localStorage.getItem("liparentSelectedTenantName") || ""
  );
  const [payments, setPayments] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedPropertyId = localStorage.getItem("liparentSelectedPropertyId") || "";
  const selectedPropertyName = localStorage.getItem("liparentSelectedPropertyName") || "";
  const selectedRoomId = localStorage.getItem("liparentSelectedRoomId") || "";
  const selectedRoomNumber = localStorage.getItem("liparentSelectedRoomNumber") || "";

  // Create payment modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    month: "",
    mode: "",
    recieptNumber: "",
  });

  // Edit payment modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editedPayment, setEditedPayment] = useState({
    amountPaid: "",
    month: "",
    modeOfPayment: "",
    recieptNumber: "",
  });

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
      if (result.error) setError(result.error);
    };

    loadTenants();
  }, [accessToken, selectedPropertyId, selectedRoomId]);

  useEffect(() => {
    if (!accessToken || !selectedPropertyId || !selectedRoomId || !selectedTenantId)
      return;

    const loadPayments = async () => {
      const result = await readAllTenantPayments(
        accessToken,
        selectedPropertyId,
        selectedRoomId,
        selectedTenantId
      );
      if (result.selectedTenantPayments) {
        setPayments(result.selectedTenantPayments);
      }
      if (result.message) setMessage(result.message);
      if (result.error) setError(result.error);
    };

    loadPayments();
  }, [accessToken, selectedPropertyId, selectedRoomId, selectedTenantId]);

  const handleTenantSelect = (e) => {
    const tenantId = e.target.value;
    setSelectedTenantId(tenantId);

    if (tenantId && tenants[tenantId]) {
      const tenantName = tenants[tenantId].tenantName;
      setSelectedTenantName(tenantName);
      localStorage.setItem("liparentSelectedTenantId", tenantId);
      localStorage.setItem("liparentSelectedTenantName", tenantName);
    }
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedTenantId) {
      setError("please select a tenant.");
      return;
    }

    if (
      !confirm(
        `Do you want to add a new payment by ${selectedTenantName} for room: ${selectedRoomNumber}?`
      )
    )
      return;

    const result = await createPayment(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      selectedTenantId,
      newPayment
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.newTenantRoomRentPayments && result.message) {
      setMessage(result.message);
      setPayments(result.newTenantRoomRentPayments);
      setShowCreateModal(false);
      setNewPayment({ amount: "", month: "", mode: "", recieptNumber: "" });
    }
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!editingPayment) return;

    if (!confirm(`Do you want to edit tenant payment with ID: "${editingPayment.paymentID}"?`))
      return;

    const result = await editPayment(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      selectedTenantId,
      editingPayment.paymentID,
      editedPayment
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.editedTenantPayments && result.message) {
      setMessage(result.message);
      setPayments(result.editedTenantPayments);
      setShowEditModal(false);
      setEditingPayment(null);
    }
  };

  const handleDeletePayment = async (payment) => {
    setError("");
    setMessage("");

    if (!confirm(`Do you want to delete tenant payment with ID: "${payment.paymentID}"?`))
      return;

    const result = await deletePayment(
      accessToken,
      selectedPropertyId,
      selectedRoomId,
      selectedTenantId,
      payment.paymentID
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.deletedTenantPayments && result.message) {
      setMessage(result.message);
      setPayments(result.deletedTenantPayments);
    }
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setEditedPayment({
      amountPaid: payment.amountPaid,
      month: payment.month,
      modeOfPayment: payment.modeOfPayment,
      recieptNumber: payment.recieptNumber,
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
              value={selectedTenantId}
              onChange={handleTenantSelect}
            >
              <option value="">SELECT TENANT</option>
              {reversedTenantKeys.map((key) => (
                <option key={key} value={key}>
                  {tenants[key].tenantName.toUpperCase()}
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
              ADD PAYMENT
            </button>
          </div>
          <div className="text-center d-flex justify-content-between w-75">
            <u>
              <h2>
                {selectedTenantName && selectedRoomNumber && selectedPropertyName
                  ? `PAYMENTS BY ${selectedTenantName} FOR ${selectedRoomNumber} IN ${selectedPropertyName}`
                  : "PAYMENTS"}
              </h2>
            </u>
            <button className="btn btn-dark">
              Export as PDF <i className="fa fa-file-pdf-o"></i>
            </button>
          </div>
        </div>

        <Toast type="error" message={error} onClose={() => setError("")} />
        <Toast type="success" message={message} onClose={() => setMessage("")} />

        <div className="overflow-auto pt-0">
          <table className="table table-active bg-white mt-2">
            <thead className="position-sticky bg-white">
              <tr>
                <th>NO.</th>
                <th>PAYMENT ID</th>
                <th>DATE</th>
                <th>MONTH</th>
                <th>PREV. BALANCE</th>
                <th>AMOUNT PAID</th>
                <th>NEW BALANCE</th>
                <th>MODE</th>
                <th>RECEIPT NO.</th>
                <th>PAYMENT ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={payment.paymentID}>
                  <td>{index + 1}</td>
                  <td>{payment.paymentID}</td>
                  <td>{payment.date}</td>
                  <td>{payment.month}</td>
                  <td>{payment.previousPaymentBalance}</td>
                  <td>{payment.amountPaid}</td>
                  <td>{payment.newBalance}</td>
                  <td>{payment.modeOfPayment}</td>
                  <td>{payment.recieptNumber}</td>
                  <td>
                    <button
                      onClick={() => openEditModal(payment)}
                      className="btn btn-primary mr-2 edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment)}
                      className="btn btn-danger ml-2 delete"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />

      {showCreateModal && (
        <Modal title="ADD PAYMENT" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreatePayment} className="form">
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT AMOUNT</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT MONTH</label>
              <input
                type="month"
                className="form-control text-uppercase"
                value={newPayment.month}
                onChange={(e) => setNewPayment({ ...newPayment, month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT MODE</label>
              <select
                className="form-control"
                value={newPayment.mode}
                onChange={(e) => setNewPayment({ ...newPayment, mode: e.target.value })}
                required
              >
                <option value="">SELECT PAYMENT MODE</option>
                <option value="CASH">CASH</option>
                <option value="M-PESA">M-PESA</option>
              </select>
            </div>
            <div className="form-group">
              <label className="font-weight-bold">RECEIPT NUMBER</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={newPayment.recieptNumber}
                onChange={(e) => setNewPayment({ ...newPayment, recieptNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                ADD PAYMENT
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && editingPayment && (
        <Modal title="EDIT PAYMENT" onClose={() => setShowEditModal(false)}>
          <h5 className="text-center">
            Payment Id:{" "}
            <span className="font-weight-light">{editingPayment.paymentID}</span>
          </h5>
          <form onSubmit={handleEditPayment} className="form">
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT MONTH</label>
              <input
                type="month"
                className="form-control text-uppercase"
                value={editedPayment.month}
                onChange={(e) => setEditedPayment({ ...editedPayment, month: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT AMOUNT</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedPayment.amountPaid}
                onChange={(e) => setEditedPayment({ ...editedPayment, amountPaid: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PAYMENT MODE</label>
              <select
                className="form-control"
                value={editedPayment.modeOfPayment}
                onChange={(e) => setEditedPayment({ ...editedPayment, modeOfPayment: e.target.value })}
                required
              >
                <option value="">SELECT PAYMENT MODE</option>
                <option value="CASH">CASH</option>
                <option value="M-PESA">M-PESA</option>
              </select>
            </div>
            <div className="form-group">
              <label className="font-weight-bold">RECEIPT NUMBER</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedPayment.recieptNumber}
                onChange={(e) => setEditedPayment({ ...editedPayment, recieptNumber: e.target.value })}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-primary w-100">
                EDIT PAYMENT
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}