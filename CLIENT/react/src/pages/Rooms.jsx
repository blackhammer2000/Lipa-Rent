import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import {
  readAllProperties,
  readAllRooms,
  createRoom,
  editRoom,
  deleteRoom,
} from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Modal from "../components/Modal";
import Toast from "../components/Toast";

export default function Rooms() {
  const { accessToken } = useAuth();
  const { confirm } = useConfirm();
  const [properties, setProperties] = useState({});
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    localStorage.getItem("liparentSelectedPropertyId") || "",
  );
  const [selectedPropertyName, setSelectedPropertyName] = useState(
    localStorage.getItem("liparentSelectedPropertyName") || "",
  );
  const [rooms, setRooms] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Create room modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomRatePerMonth: "",
    roomArea: "",
    roomType: "",
  });

  // Edit room modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editedRoom, setEditedRoom] = useState({
    roomNumber: "",
    roomType: "",
    roomArea: "",
    roomRatePerMonth: "",
  });

  useEffect(() => {
    if (!accessToken) return;

    const loadProperties = async () => {
      const result = await readAllProperties(accessToken);
      if (result.propertiesOwned) setProperties(result.propertiesOwned);
      if (result.error) setError(result.error);
    };

    loadProperties();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !selectedPropertyId) return;

    const loadRooms = async () => {
      const result = await readAllRooms(accessToken, selectedPropertyId);
      if (result.propertyRooms) setRooms(result.propertyRooms);
      if (result.message) setMessage(result.message);
      if (result.error) setError(result.error);
    };

    loadRooms();
  }, [accessToken, selectedPropertyId]);

  const handlePropertySelect = (e) => {
    const propertyId = e.target.value;
    setSelectedPropertyId(propertyId);

    if (propertyId && properties[propertyId]) {
      const propertyName = properties[propertyId].propertyName;
      setSelectedPropertyName(propertyName);
      localStorage.setItem("liparentSelectedPropertyId", propertyId);
      localStorage.setItem("liparentSelectedPropertyName", propertyName);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedPropertyId) {
      setError("please select a property.");
      return;
    }

    const result = await createRoom(accessToken, selectedPropertyId, newRoom);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.propertyRooms && result.message) {
      setMessage(result.message);
      setRooms(result.propertyRooms);
      setShowCreateModal(false);
      setNewRoom({
        roomNumber: "",
        roomRatePerMonth: "",
        roomArea: "",
        roomType: "",
      });
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!editingRoom) return;

    const confirmed = await confirm({
      title: "Edit Room",
      message: `Do you want to edit room with ID: "${editingRoom.roomID}" on property with ID: "${selectedPropertyId}"?`,
      confirmText: "Edit",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    const result = await editRoom(
      accessToken,
      selectedPropertyId,
      editingRoom.roomID,
      editedRoom,
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.editedRooms && result.message) {
      setMessage(result.message);
      setRooms(result.editedRooms);
      setShowEditModal(false);
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = async (room) => {
    setError("");
    setMessage("");

    const confirmed = await confirm({
      title: "Delete Room",
      message: `Do you want to delete room with ID: "${room.roomID}" on property with ID: "${selectedPropertyId}"?`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
    });
    if (!confirmed) return;

    const result = await deleteRoom(
      accessToken,
      selectedPropertyId,
      room.roomID,
    );

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.deletedRooms && result.message) {
      setMessage(result.message);
      setRooms(result.deletedRooms);
    }
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setEditedRoom({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      roomArea: room.roomArea,
      roomRatePerMonth: room.roomRatePerMonth,
    });
    setShowEditModal(true);
  };

  const roomStats = { totalRooms: 0, occupiedRooms: 0 };
  Object.keys(rooms).forEach((key) => {
    if (rooms[key].roomID) roomStats.totalRooms++;
    if (rooms[key].isOccupied && rooms[key].currentTenantID)
      roomStats.occupiedRooms++;
  });

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
              value={selectedPropertyId}
              onChange={handlePropertySelect}
            >
              <option value="">SELECT PROPERTY</option>
              {Object.keys(properties).map((key) => (
                <option key={key} value={key}>
                  {properties[key].propertyName.toUpperCase()}
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
              CREATE ROOM
            </button>
          </div>
          <div className="d-flex justify-content-around w-75">
            <u>
              <h2>
                {selectedPropertyName
                  ? `ROOMS FOR ${selectedPropertyName.toUpperCase()}`
                  : "ROOMS"}
              </h2>
            </u>
            <div className="d-flex justify-content-center align-items-center">
              <ul className="d-flex list-unstyled mt-2 gap-2">
                <li className="mr-2">TOTAL: {roomStats.totalRooms}</li>
                <li className="text-success">
                  OCCUPIED: {roomStats.occupiedRooms}
                </li>
                <li className="text-danger">
                  VACANT: {roomStats.totalRooms - roomStats.occupiedRooms}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Toast type="error" message={error} onClose={() => setError("")} />
        <Toast
          type="success"
          message={message}
          onClose={() => setMessage("")}
        />

        <div className="overflow-auto pt-0">
          <table className="table table-active bg-white mt-2">
            <thead className="position-sticky bg-white">
              <tr>
                <th>NO.</th>
                <th>ROOM ID</th>
                <th>ROOM NUMBER</th>
                <th>ROOM TYPE</th>
                <th>ROOM AREA(sqFt)</th>
                <th>ROOM RATE</th>
                <th>VACANCY</th>
                <th>CURRENT TENANT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(rooms).map((key, index) => {
                const room = rooms[key];
                return (
                  <tr key={key}>
                    <td>{index + 1}</td>
                    <td>{room.roomID}</td>
                    <td>{room.roomNumber}</td>
                    <td>{room.roomType}</td>
                    <td>{room.roomArea}</td>
                    <td>KES. {room.roomRatePerMonth}</td>
                    <td
                      className={
                        room.isOccupied ? "text-success" : "text-danger"
                      }
                    >
                      {room.isOccupied ? "Occupied" : "Vacant"}
                    </td>
                    <td>
                      {room.currentTenantID ? room.currentTenantID : "none"}
                    </td>
                    <td>
                      <button
                        onClick={() => openEditModal(room)}
                        className="btn btn-primary mr-2 edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
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
        <Modal title="CREATE ROOM" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreateRoom} className="form">
            <div className="form-group">
              <input
                placeholder="ROOM NUMBER"
                type="text"
                className="form-control text-uppercase"
                value={newRoom.roomNumber}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, roomNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="ROOM RATE PER MONTH"
                type="text"
                className="form-control text-uppercase"
                value={newRoom.roomRatePerMonth}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, roomRatePerMonth: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="ROOM AREA(sqFt)"
                type="text"
                className="form-control text-uppercase"
                value={newRoom.roomArea}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, roomArea: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <input
                placeholder="ROOM TYPE"
                type="text"
                className="form-control text-uppercase"
                value={newRoom.roomType}
                onChange={(e) =>
                  setNewRoom({ ...newRoom, roomType: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-success w-100">
                ADD ROOM
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showEditModal && editingRoom && (
        <Modal title="EDIT ROOM" onClose={() => setShowEditModal(false)}>
          <h5 className="text-center">
            Room Id:{" "}
            <span className="font-weight-light">{editingRoom.roomID}</span>
          </h5>
          <form onSubmit={handleEditRoom} className="form">
            <div className="form-group">
              <label className="font-weight-bold">ROOM NUMBER:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedRoom.roomNumber}
                onChange={(e) =>
                  setEditedRoom({ ...editedRoom, roomNumber: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">ROOM TYPE:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedRoom.roomType}
                onChange={(e) =>
                  setEditedRoom({ ...editedRoom, roomType: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">ROOM AREA:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedRoom.roomArea}
                onChange={(e) =>
                  setEditedRoom({ ...editedRoom, roomArea: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="font-weight-bold">ROOM RATE:</label>
              <input
                type="text"
                className="form-control text-uppercase"
                value={editedRoom.roomRatePerMonth}
                onChange={(e) =>
                  setEditedRoom({
                    ...editedRoom,
                    roomRatePerMonth: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-group text-center">
              <button type="submit" className="btn btn-primary w-100">
                EDIT ROOM
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
