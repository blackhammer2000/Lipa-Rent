import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  readOwnerDetails,
  editOwnerDetails,
  generateResetPasswordCode,
  verifyResetPasswordCode,
  editPassword,
  verifyPassword,
  generateDeleteAccountCode,
  verifyDeleteAccountCode,
  deleteAccount,
} from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";

export default function Profile() {
  const { accessToken, handleLogout } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Edit account modal
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editedOwner, setEditedOwner] = useState({
    name: "",
    nationalID: "",
    email: "",
    phone: "",
  });

  // Change password flow
  const [showResetCodeModal, setShowResetCodeModal] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Delete account flow
  const [showVerifyPasswordModal, setShowVerifyPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [showDeleteCodeModal, setShowDeleteCodeModal] = useState(false);
  const [deleteCode, setDeleteCode] = useState("");

  const handleEditAccountClick = async () => {
    if (!confirm("Do you want to change your account details?")) return;

    const result = await readOwnerDetails(accessToken);

    if (result.owner) {
      const { name, nationalID, email, phone } = result.owner;
      setEditedOwner({ name, nationalID, email, phone });
      setShowEditAccountModal(true);
    }
    if (result.error) setError(result.error);
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !confirm(
        "Are you sure you wish to proceed with editing the owner details?, If so you will be required to log in again after changing any of the login details."
      )
    )
      return;

    const result = await editOwnerDetails(accessToken, {
      name: editedOwner.name.toUpperCase(),
      nationalID: editedOwner.nationalID,
      email: editedOwner.email,
      phone: editedOwner.phone,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      setShowEditAccountModal(false);
      if (result.triggerLogOut) {
        await handleLogout();
      }
    }
  };

  const handleChangePasswordClick = async () => {
    if (!confirm("Do you want to change your password?")) return;

    const result = await generateResetPasswordCode(accessToken);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) setMessage(result.message);

    if (result.resetPasswordToken && result.resetPasswordToken !== "null") {
      alert(result.resetPasswordToken);
    }

    setShowResetCodeModal(true);
  };

  const handleVerifyResetCode = async (e) => {
    e.preventDefault();
    setError("");

    const result = await verifyResetPasswordCode(accessToken, resetCode);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      setShowResetCodeModal(false);
      setShowChangePasswordModal(true);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await editPassword(
      newPassword,
      confirmNewPassword,
      accessToken,
      resetCode
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      setShowChangePasswordModal(false);
      setNewPassword("");
      setConfirmNewPassword("");
      setResetCode("");
      await handleLogout();
    }
  };

  const handleDeleteAccountClick = () => {
    if (!confirm("Do you want to delete your account?")) return;
    setShowVerifyPasswordModal(true);
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    setError("");

    const verifyResult = await verifyPassword(accessToken, password);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) setMessage(verifyResult.message);

    const codeResult = await generateDeleteAccountCode(accessToken);

    if (codeResult.error) {
      setError(codeResult.error);
      return;
    }

    if (codeResult.message) setMessage(codeResult.message);

    if (codeResult.deleteAccountToken && codeResult.deleteAccountToken !== "null") {
      alert(codeResult.deleteAccountToken);
    }

    setShowVerifyPasswordModal(false);
    setShowDeleteCodeModal(true);
  };

  const handleVerifyDeleteCode = async (e) => {
    e.preventDefault();
    setError("");

    const verifyResult = await verifyDeleteAccountCode(accessToken, deleteCode);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) setMessage(verifyResult.message);

    const deleteResult = await deleteAccount(accessToken, deleteCode);

    if (deleteResult.error) {
      setError(deleteResult.error);
      return;
    }

    if (deleteResult.message) {
      setMessage(deleteResult.message);
      setShowDeleteCodeModal(false);
      await handleLogout();
    }
  };

  return (
    <div className="home container-fluid font-italic">
      <Header />

      <div className="hero mt-5 d-flex flex-column container-fluid text-center">
        <div className="first d-flex justify-content-between mb-2">
          <div className="text-center container">
            <u>
              <h2>ACCOUNT SETTINGS</h2>
            </u>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="container border border-dark mt-4 py-4">
          <div className="container d-flex flex-column align-items-start">
            <h4>Profile Details</h4>
            <ul className="d-flex flex-column list-unstyled text-left">
              <li className="mb-3" style={{ cursor: "pointer" }} onClick={handleEditAccountClick}>
                <i className="fa fa-user mr-2"></i>Change profile details
              </li>
              <li style={{ cursor: "pointer" }} onClick={handleChangePasswordClick}>
                <i className="fa fa-key mr-2"></i>Change password
              </li>
            </ul>
          </div>
          <div className="container d-flex flex-column align-items-start mt-3 border-0 border-top border-dark">
            <h4>Reset Account</h4>
            <ul className="d-flex flex-column list-unstyled text-left">
              <li style={{ cursor: "pointer" }} onClick={handleDeleteAccountClick}>
                <i className="fa fa-trash mr-2"></i>Delete Account
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />

      {showEditAccountModal && (
        <Modal title="EDIT PROFILE DETAILS" onClose={() => setShowEditAccountModal(false)}>
          <form onSubmit={handleEditAccountSubmit} className="form">
            <div className="form-group">
              <label className="font-weight-bold">NAME:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedOwner.name}
                onChange={(e) => setEditedOwner({ ...editedOwner, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">NATIONAL ID</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedOwner.nationalID}
                onChange={(e) => setEditedOwner({ ...editedOwner, nationalID: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">EMAIL:</label>
              <input
                type="text"
                className="form-control"
                value={editedOwner.email}
                onChange={(e) => setEditedOwner({ ...editedOwner, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PHONE:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedOwner.phone}
                onChange={(e) => setEditedOwner({ ...editedOwner, phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-primary w-100">
                EDIT ACCOUNT
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showResetCodeModal && (
        <Modal title="Enter password reset code" onClose={() => setShowResetCodeModal(false)}>
          <form onSubmit={handleVerifyResetCode} className="form">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Verify
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showChangePasswordModal && (
        <Modal title="Password Reset" onClose={() => setShowChangePasswordModal(false)}>
          <form onSubmit={handleChangePasswordSubmit} className="form">
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showVerifyPasswordModal && (
        <Modal title="Verify password" onClose={() => setShowVerifyPasswordModal(false)}>
          <form onSubmit={handleVerifyPassword} className="form">
            <div className="form-group">
              <input
                type="password"
                className="form-control"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Verify
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteCodeModal && (
        <Modal title="Enter account deletion code" onClose={() => setShowDeleteCodeModal(false)}>
          <form onSubmit={handleVerifyDeleteCode} className="form">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Verify
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}