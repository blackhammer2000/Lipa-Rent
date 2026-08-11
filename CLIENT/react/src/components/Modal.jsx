export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay d-flex justify-content-center align-items-center">
      <fieldset className="border border-success p-5 border-radius-50 bg-white">
        <legend className="d-flex justify-content-around text-center">
          <h4>{title}</h4>
          <span className="closeModal" draggable="true">
            <button onClick={onClose} className="btn btn-danger">
              X
            </button>
          </span>
        </legend>
        {children}
      </fieldset>
    </div>
  );
}