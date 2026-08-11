import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  readAllProperties,
  readOwnerDetails,
  createProperty,
  editProperty,
  deleteProperty,
} from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";

export default function Dashboard() {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState({});
  const [ownerName, setOwnerName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Create property modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProperty, setNewProperty] = useState({
    propertyName: "",
    propertyNumber: "",
    propertyLocation: "",
  });

  // Edit property modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [editedProperty, setEditedProperty] = useState({
    propertyName: "",
    propertyNumber: "",
    propertyLocation: "",
  });

  useEffect(() => {
    if (!accessToken) return;

    const loadData = async () => {
      const ownerResult = await readOwnerDetails(accessToken);
      if (ownerResult.owner) setOwnerName(ownerResult.owner.name);

      const propertiesResult = await readAllProperties(accessToken);
      if (propertiesResult.propertiesOwned) {
        setProperties(propertiesResult.propertiesOwned);
      }
      if (propertiesResult.error) setError(propertiesResult.error);
    };

    loadData();
  }, [accessToken]);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !confirm(
        `Do you want to create property with Name: "${newProperty.propertyName}", and Number: "${newProperty.propertyNumber}", located at: "${newProperty.propertyLocation}"?`
      )
    )
      return;

    const result = await createProperty(accessToken, newProperty);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.newProperties && result.message) {
      setMessage(result.message);
      setProperties(result.newProperties);
      setShowCreateModal(false);
      setNewProperty({ propertyName: "", propertyNumber: "", propertyLocation: "" });
    }
  };

  const handleEditProperty = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!editingProperty) return;

    if (
      !confirm(
        `Do you want to edit, property with ID: "${editingProperty.propertyID}", with Number: "${editingProperty.propertyNumber}"?`
      )
    )
      return;

    const result = await editProperty(
      accessToken,
      editingProperty.propertyID,
      editingProperty.propertyNumber,
      editedProperty
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.editedProperties && result.message) {
      setMessage(result.message);
      setProperties(result.editedProperties);
      setShowEditModal(false);
      setEditingProperty(null);
    }
  };

  const handleDeleteProperty = async (property) => {
    setError("");
    setMessage("");

    if (
      !confirm(
        `Do you want to delete, "${property.propertyName}", with Number: "${property.propertyNumber}"?`
      )
    )
      return;

    const result = await deleteProperty(accessToken, property.propertyID, property.propertyNumber);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.deletedProperties && result.message) {
      setMessage(result.message);
      setProperties(result.deletedProperties);
    }
  };

  const openEditModal = (property) => {
    setEditingProperty(property);
    setEditedProperty({
      propertyName: property.propertyName,
      propertyNumber: property.propertyNumber,
      propertyLocation: property.propertyLocation,
    });
    setShowEditModal(true);
  };

  return (
    <div className="home container-fluid font-italic">
      <Header />

      <div className="hero mt-5 d-flex flex-column container-fluid text-center">
        <div className="first d-flex justify-content-between mb-2">
          <div className="text-left w-25">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-success"
            >
              CREATE PROPERTY
            </button>
          </div>
          <div className="text-center w-75">
            <u>
              <h2 data-dashboard-description>
                {ownerName ? `PROPERTIES OF ${ownerName}` : "PROPERTIES"}
              </h2>
            </u>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="overflow-auto pt-0">
          <table className="table table-active bg-white mt-2">
            <thead className="position-sticky bg-white">
              <tr>
                <th>NO.</th>
                <th>PROPERTY ID</th>
                <th>PROPERTY NAME</th>
                <th>PROPERTY NUMBER</th>
                <th>PROPERTY LOCATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(properties).map((key, index) => {
                const property = properties[key];
                return (
                  <tr key={key}>
                    <td>{index + 1}</td>
                    <td>{property.propertyID}</td>
                    <td>{property.propertyName}</td>
                    <td>{property.propertyNumber}</td>
                    <td>{property.propertyLocation}</td>
                    <td>
                      <button
                        onClick={() => openEditModal(property)}
                        className="btn btn-primary mr-2 edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProperty(property)}
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
        <Modal title="CREATE PROPERTY" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateProperty} className="form">
            <div className="form-group">
              <input
                placeholder="PROPERTY NAME"
                type="text"
                className="form-control text-uppercase"
                value={newProperty.propertyName}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, propertyName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="PROPERTY NUMBER"
                type="text"
                className="form-control text-uppercase"
                value={newProperty.propertyNumber}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, propertyNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="PROPERTY LOCATION"
                type="text"
                className="form-control text-uppercase"
                value={newProperty.propertyLocation}
                onChange={(e) =>
                  setNewProperty({ ...newProperty, propertyLocation: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                CREATE PROPERTY
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && editingProperty && (
        <Modal title="EDIT PROPERTY" onClose={() => setShowEditModal(false)}>
          <h5 className="text-center">
            Property Id:{" "}
            <span className="font-weight-light">{editingProperty.propertyID}</span>
          </h5>
          <form onSubmit={handleEditProperty} className="form">
            <div className="form-group">
              <label className="font-weight-bold">PROPERTY NAME:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedProperty.propertyName}
                onChange={(e) =>
                  setEditedProperty({ ...editedProperty, propertyName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PROPERTY NUMBER:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedProperty.propertyNumber}
                onChange={(e) =>
                  setEditedProperty({ ...editedProperty, propertyNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">PROPERTY LOCATION:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedProperty.propertyLocation}
                onChange={(e) =>
                  setEditedProperty({ ...editedProperty, propertyLocation: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-primary w-100">
                EDIT PROPERTY
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}