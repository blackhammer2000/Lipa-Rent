import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";

export default function Footer() {
  const { handleLogout } = useAuth();
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  const onLogout = async () => {
    const confirmed = await confirm({
      title: "Confirm Logout",
      message: "Are you sure you want to log out of your account?",
      confirmText: "Log Out",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) return;
    await handleLogout();
    navigate("/login");
  };

  return (
    <footer className="footer mt-5 font-weight-bold d-flex container-fluid border-top border-success pt-3">
      <div className="copyrights w-50 pl-5">
        <span>
          LiPA<span className="text-success">RENT&reg;</span>
        </span>
        2024
      </div>

      <div className="conditions w-50 d-flex justify-content-center align-items-center">
        <ul className="d-flex justify-content-center align-items-center list-unstyled gap-4">
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
          <li>
            <button onClick={onLogout} className="btn btn-outline-danger">
              LOG OUT
            </button>
          </li>
        </ul>
      </div>
    </footer>
  );
}
