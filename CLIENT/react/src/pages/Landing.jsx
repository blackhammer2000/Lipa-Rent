import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  sendSignUpOtp,
  verifySignUpOtp,
  completeSignUp,
} from "../services/api";
import Modal from "../components/Modal";

export default function Landing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    nationalID: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signUpToken, setSignUpToken] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const user = { ...formData };

    const result = await sendSignUpOtp(user);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message) setMessage(result.message);

    if (result.signUpOtp) alert(result.signUpOtp);

    if (result.signUpToken && result.message && result.message.includes("verified")) {
      const signUpResult = await completeSignUp(result.signUpToken, {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });

      if (signUpResult.error) {
        setError(signUpResult.error);
        return;
      }

      if (signUpResult.message) {
        setMessage(signUpResult.message);
        navigate("/login");
      }
      return;
    }

    if (result.signUpToken) {
      setSignUpToken(result.signUpToken);
      setShowOtpModal(true);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) return;

    const verifyResult = await verifySignUpOtp(otp, signUpToken);

    if (verifyResult.error) {
      setError(verifyResult.error);
      return;
    }

    if (verifyResult.message) setMessage(verifyResult.message);

    const signUpResult = await completeSignUp(verifyResult.signUpToken, {
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (signUpResult.error) {
      setError(signUpResult.error);
      return;
    }

    if (signUpResult.message) {
      setMessage(signUpResult.message);
      setShowOtpModal(false);
      navigate("/login");
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

        <div className="action d-flex justify-content-md-center align-items-center w-50">
          <ul className="d-flex list-unstyled">
            <li>
              <Link to="/login">
                <button className="btn btn-outline-success ml-2">LOG IN</button>
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="hero mt-5 container-fluid">
        <div className="first d-flex container-fluid">
          <div className="heroText w-50 d-flex justify-content-center align-items-center">
            <h2 className="font-weight-bold text-white">
              RENTAL PROPERTY MANAGEMENT <br />
              MADE EASY WITH <br />
              <span>
                LiPA<span className="text-success">RENT&reg;</span>
              </span>
            </h2>
          </div>
          <div className="ctaform w-50 d-flex justify-content-center align-items-center border-left border-success">
            <fieldset className="border border-success p-5 border-radius-50">
              <legend className="font-weight-bold text-center">GET STARTED</legend>
              <form onSubmit={handleSubmit} className="form">
                <div className="form-group">
                  <input
                    name="name"
                    placeholder="Name"
                    type="text"
                    className="form-control text-uppercase"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    name="nationalID"
                    placeholder="NATIONAL ID"
                    type="text"
                    className="form-control"
                    value={formData.nationalID}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    name="email"
                    placeholder="EMAIL"
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    name="phone"
                    placeholder="PHONE(+254...)"
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <div className="password-input-group">
                    <input
                      name="password"
                      placeholder="PASSWORD"
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
                <div className="form-group">
                  <div className="password-input-group">
                    <input
                      name="confirmPassword"
                      placeholder="CONFIRM PASSWORD"
                      type={showConfirmPassword ? "text" : "password"}
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      <i className={`fa ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>
                {error && <div className="alert alert-danger">{error}</div>}
                {message && <div className="alert alert-success">{message}</div>}
                <div className="form-group text-center">
                  <button type="submit" className="btn btn-success w-100">
                    SIGN UP
                  </button>
                </div>
              </form>
            </fieldset>
          </div>
        </div>
      </div>

      <footer className="footer mt-5 font-weight-bold d-flex container-fluid border-top border-success py-3">
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
                About Us
              </a>
            </li>
            <li>
              <a className="text-dark" href="">
                Contact
              </a>
            </li>
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
        <Modal title="Enter Sign Up OTP" onClose={() => setShowOtpModal(false)}>
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
    </div>
  );
}