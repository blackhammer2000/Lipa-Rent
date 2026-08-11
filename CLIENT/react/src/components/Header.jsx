import { useState } from "react";
import { Link } from "react-router-dom";

export default function Header({ showPropertySelector = false, children }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="header d-flex container-fluid align-items-center mt-2 border-bottom border-success">
      <div className="heading d-flex justify-content-start align-items-center w-50 border-success">
        <div className="profile position-relative">
          <i
            className="fa fa-user-circle font-weight-bold text-dark"
            onClick={() => setShowDropdown(!showDropdown)}
          ></i>
          {showDropdown && (
            <div className="userDropdown dropdown position-absolute">
              <ul className="d-flex flex-column dropdown-menu list-unstyled show">
                <li className="dropdown-item">
                  <Link to="/profile" onClick={() => setShowDropdown(false)}>
                    My Profile
                  </Link>
                </li>
                <li className="dropdown-item">
                  <Link to="/subscriptions" onClick={() => setShowDropdown(false)}>
                    My Subscriptions
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
        <div className="d-flex flex-column container ml-5">
          <div className="logo d-flex justify-content-center align-items-center w-50">
            <h1 className="font-weight-bolder">
              <span>
                LiPA<span className="text-success">RENT</span>
              </span>
            </h1>
            <i className="fa fa-home"></i>
          </div>

          {showPropertySelector && (
            <div className="action d-flex justify-content-center align-items-center w-50">
              {children}
            </div>
          )}
        </div>
      </div>

      <div className="routers mt-4 d-flex w-50 justify-content-center">
        <ul className="list-unstyled d-flex">
          <li className="mr-4">
            <Link to="/dashboard">
              <button className="btn btn-outline-success">DASH</button>
            </Link>
          </li>
          <li>
            <Link to="/rooms">
              <button className="btn btn-outline-success">ROOMS</button>
            </Link>
          </li>
          <li className="ml-4">
            <Link to="/tenants">
              <button className="btn btn-outline-success">TENANTS</button>
            </Link>
          </li>
          <li className="ml-4">
            <Link to="/rents">
              <button className="btn btn-outline-success">RENTS</button>
            </Link>
          </li>
          <li className="ml-4">
            <Link to="/revenue">
              <button className="btn btn-outline-success">REVENUE</button>
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}