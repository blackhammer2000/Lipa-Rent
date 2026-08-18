import { useContext } from "react";
import { createPortal } from "react-dom";
import { LoaderContext } from "../context/LoaderContext";

export default function Loader() {
  const { loading, message } = useContext(LoaderContext);

  if (!loading) return null;

  return createPortal(
    <div className="loader-overlay">
      <div className="loader-box">
        <div className="loader-spinner"></div>
        <div className="loader-text">{message}</div>
      </div>
    </div>,
    document.body
  );
}