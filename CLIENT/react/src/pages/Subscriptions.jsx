import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { readSubscriptions } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";

export default function Subscriptions() {
  const { accessToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentTime] = useState(() => Date.now());

  useEffect(() => {
    if (!accessToken) return;

    const loadSubscriptions = async () => {
      const result = await readSubscriptions(accessToken);

      if (result.subscriptions) {
        setSubscriptions(result.subscriptions);
      }
      if (result.message) setMessage(result.message);
      if (result.error) setError(result.error);
    };

    loadSubscriptions();
  }, [accessToken]);

  const reversedSubscriptions = [...subscriptions].reverse();

  return (
    <div className="home container-fluid font-italic">
      <Header />

      <div className="hero mt-5 d-flex flex-column container-fluid text-center">
        <div className="first d-flex justify-content-between mb-2">
          <div className="text-center container">
            <u>
              <h2>SUBSCRIPTION REPORTS</h2>
            </u>
          </div>
        </div>

       <Toast type="error" message={error} onClose={() => setError("")} />
       <Toast type="success" message={message} onClose={() => setMessage("")} />

        <div className="overflow-auto pt-0">
          <table className="table table-active bg-white mt-2">
            <thead className="position-sticky bg-white">
              <tr>
                <th>NO.</th>
                <th>SUBSCRIPTION ID</th>
                <th>SUBSCRIPTION START</th>
                <th>SUBSCRIPTION EXPIRY</th>
                <th>SUBSCRIPTION STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reversedSubscriptions.map((subscription, index) => {
                const { subscription_id, currentSubscription } = subscription;
                const { start, expires } = currentSubscription;
                const isActive = currentTime < expires;

                return (
                  <tr key={subscription_id}>
                    <td>{index + 1}</td>
                    <td>{subscription_id}</td>
                    <td>{new Date(start).toLocaleDateString()}</td>
                    <td>{new Date(expires).toLocaleDateString()}</td>
                    <td className={isActive ? "text-success" : "text-danger"}>
                      {isActive ? "Active" : "Expired"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  );
}