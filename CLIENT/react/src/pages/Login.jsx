import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  login,
  sendLoginOtp,
  verifyLoginOtp,
  verifyUserInfo,
  generateForgotPasswordCode,
  verifyForgotPasswordCode,
  editForgotPassword,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

export default function Login() {
  const navigate = useNavigate();
  const { handleLogin } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    nationalID: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loginToken, setLoginToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNationalId, setForgotNationalId] = useState("");
  const [forgotToken, setForgotToken] = useState(null);
  const [showForgotOtpModal, setShowForgotOtpModal] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const loginResult = await login(formData);

    if (loginResult.error) {
      setError(loginResult.error);
      return;
    }

    if (loginResult.loginToken) {
      const otpResult = await sendLoginOtp(loginResult.loginToken);

      if (otpResult.error) {
        setError(otpResult.error);
        return;
      }

      if (otpResult.newLoginOtp) alert(otpResult.newLoginOtp);

      if (otpResult.message) setMessage(otpResult.message);

      if (otpResult.loginToken) {
        setLoginToken(otpResult.loginToken);
        setShowOtpModal(true);
      }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) return;

    const verifyResult = await verifyLoginOtp(loginToken, otp);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) setMessage(verifyResult.message);

    if (verifyResult.token) {
      handleLogin(verifyResult.token);
      setShowOtpModal(false);
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const verifyResult = await verifyUserInfo(forgotEmail, forgotNationalId);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) setMessage(verifyResult.message);

    const codeResult = await generateForgotPasswordCode(verifyResult.token);

    if (codeResult.error) {
      setError(codeResult.error);
      return;
    }

    if (codeResult.message) setMessage(codeResult.message);

    if (codeResult.resetPasswordToken && codeResult.resetPasswordToken !== "null") {
      alert(codeResult.resetPasswordToken);
    }

    setForgotToken(verifyResult.token);
    setShowForgotModal(false);
    setShowForgotOtpModal(true);
  };

  const handleVerifyForgotOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!forgotOtp) return;

    const verifyResult = await verifyForgotPasswordCode(forgotToken, forgotOtp);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) {
      setMessage(verifyResult.message);
      setShowForgotOtpModal(false);
      setShowChangePasswordModal(true);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await editForgotPassword(
      newPassword,
      confirmNewPassword,
      forgotToken,
      forgotOtp
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) {
      setMessage(result.message);
      setShowChangePasswordModal(false);
      setForgotToken(null);
      setForgotOtp("");
      setNewPassword("");
      setConfirmNewPassword("");
    }
  };

  return (
    <div className="home container-fluid font-italic auth-page">
      <div className="header d-flex container-fluid justify-content-around align-items-center mt-2 border-bottom border-success">
        <div className="logo d-flex justify-content-center align-items-center w-50">
          <h1 className="font-weight-bolder">
            <span>
              LiPA<span className="text-success">RENT</span>
            </span>
          </h1>
          <i className="fa fa-home"></i>
        </div>

        <div className="action d-flex justify-content-center align-items-center w-50">
          <ul className="d-flex list-unstyled">
            <li>
              <Link to="/">
                <button className="btn btn-outline-success ml-2">SIGN UP</button>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="hero ctaform">
        <fieldset className="first border border-success p-5 border-radius-50">
          <legend className="font-weight-bold text-center">LOGIN</legend>
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <input
                name="email"
                placeholder="Email"
                type="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                name="nationalID"
                placeholder="National ID"
                type="text"
                className="form-control"
                value={formData.nationalID}
                onChange={handleChange}
                required
              />
            </div>
              <div className="form-group">
                <div className="password-input-group">
                  <input
                    name="password"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                  </button>
                </div>
              </div>
                <Toast type="error" message={error} onClose={() => setError("")} />
                <Toast type="success" message={message} onClose={() => setMessage("")} />

            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                LOG IN
              </button>
            </div>

            <div className="form-group text-center forgot-link">
              <span
                onClick={() => setShowForgotModal(true)}
                style={{ cursor: "pointer" }}
              >
                Forgot password?
              </span>
            </div>
          </form>
        </fieldset>
      </div>

      <footer className="footer mt-5 font-weight-bold text-center d-flex container-fluid border-top border-success py-3">
        <div className="copyrights w-50 text-center">
          <span>
            LiPA<span className="text-success">RENT&reg;</span>
          </span>
          2024
        </div>
        <div className="conditions w-50 d-flex justify-content-center align-items-center">
          <ul className="d-flex list-unstyled gap-4">
            <li>
              <a className="text-dark" href="">
                Terms & Conditions
              </a>
            </li>
            <li>
              <a className="text-dark" href="">
                Privacy Policies
              </a>
            </li>
          </ul>
        </div>
      </footer>

      {showOtpModal && (
        <Modal title="Enter login OTP" onClose={() => setShowOtpModal(false)}>
          <form onSubmit={handleVerifyOtp} className="form">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Verify
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showForgotModal && (
        <Modal title="Verify Details" onClose={() => setShowForgotModal(false)}>
          <form onSubmit={handleForgotPassword} className="form">
            <div className="form-group">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                placeholder="National ID"
                value={forgotNationalId}
                onChange={(e) => setForgotNationalId(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Verify
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showForgotOtpModal && (
        <Modal title="Enter password reset OTP" onClose={() => setShowForgotOtpModal(false)}>
          <form onSubmit={handleVerifyForgotOtp} className="form">
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                required
              />
            </div>
            {error && <div className="alert alert-danger">{error}</div>}
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
          <form onSubmit={handleChangePassword} className="form">
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
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                Submit
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}