import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { readAllProperties, readAllPaymentsForRevenue } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Revenue() {
  const { accessToken } = useAuth();
  const [properties, setProperties] = useState({});
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    localStorage.getItem("liparentRevenueSelectedPropertyId") || ""
  );
  const [selectedPropertyName, setSelectedPropertyName] = useState(
    localStorage.getItem("liparentRevenueSelectedPropertyName") || ""
  );
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [projectedRevenue, setProjectedRevenue] = useState(0);
  const [deficitRevenue, setDeficitRevenue] = useState(0);
  const [lineChartData, setLineChartData] = useState(null);
  const [pieChartData, setPieChartData] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    const loadProperties = async () => {
      const result = await readAllProperties(accessToken);
      if (result.propertiesOwned) setProperties(result.propertiesOwned);
      if (result.error) setError(result.error);
    };

    loadProperties();
  }, [accessToken]);

  const handlePropertySelect = (e) => {
    const propertyId = e.target.value;
    setSelectedPropertyId(propertyId);

    if (propertyId && properties[propertyId]) {
      const propertyName = properties[propertyId].propertyName;
      setSelectedPropertyName(propertyName);
      localStorage.setItem("liparentRevenueSelectedPropertyId", propertyId);
      localStorage.setItem("liparentRevenueSelectedPropertyName", propertyName);
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!selectedPropertyId) {
      setError("please select a property.");
      return;
    }

    if (!month && !year) {
      setError("please select a month or year.");
      return;
    }

    const result = await readAllPaymentsForRevenue(accessToken, selectedPropertyId);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.message && result.propertyRents && result.propertyExpectedRevenueMonthly) {
      setMessage(result.message);

      // Collect all payments per room first
      const roomPayments = {}; // { roomId: [payments] }
      for (const roomId in result.propertyRents) {
        roomPayments[roomId] = [];
        for (const tenantId in result.propertyRents[roomId]) {
          roomPayments[roomId] = [
            ...roomPayments[roomId],
            ...result.propertyRents[roomId][tenantId],
          ];
        }
      }

      let allPayments = [];
      Object.keys(roomPayments).forEach((roomId) => {
        allPayments = [...allPayments, ...roomPayments[roomId]];
      });

      if (!allPayments.length) {
        setError("No payments found for the selected property.");
        return;
      }

      const selectedRangePayments = allPayments.filter((payment) => {
        if (
          (month && payment.month === month) ||
          (year && payment.month.slice(0, 4) === year)
        )
          return payment;
      });

      if (!selectedRangePayments.length) {
        setError("No payments found for the selected range.");
        return;
      }

      let selectedRangeTotalRevenue = 0;
      selectedRangePayments.forEach((payment) => {
        selectedRangeTotalRevenue += +payment.amountPaid;
      });

      const propertyExpectedRevenueForSelectedRange = month
        ? result.propertyExpectedRevenueMonthly
        : year
        ? result.propertyExpectedRevenueMonthly * 12
        : 0;

      const selectedRangeDeficitRevenue =
        propertyExpectedRevenueForSelectedRange - selectedRangeTotalRevenue;

      setTotalRevenue(selectedRangeTotalRevenue);
      setProjectedRevenue(propertyExpectedRevenueForSelectedRange);
      setDeficitRevenue(selectedRangeDeficitRevenue);

      // ---- Line chart: Total (blue) vs Projected (black) per month ----
      const months = [...new Set(selectedRangePayments.map((p) => p.month))].sort();
      const totalPerMonth = months.map((m) => {
        return selectedRangePayments
          .filter((p) => p.month === m)
          .reduce((sum, p) => sum + +p.amountPaid, 0);
      });

      // Distribute projected revenue evenly across the months shown
      const projectedPerMonth = months.map(
        () => Math.round(propertyExpectedRevenueForSelectedRange / months.length) || 0
      );

      setLineChartData({
        labels: months,
        datasets: [
          {
            label: "Total Revenue",
            data: totalPerMonth,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.15)",
            pointBackgroundColor: "#2563eb",
            fill: true,
            tension: 0.3,
          },
          {
            label: "Projected Revenue",
            data: projectedPerMonth,
            borderColor: "#000000",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            pointBackgroundColor: "#000000",
            pointBorderColor: "#ffffff",
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
          },
        ],
      });

      // ---- Pie chart: Room contributions to total revenue ----
      const roomContributions = {};
      Object.keys(roomPayments).forEach((roomId) => {
        const roomTotal = roomPayments[roomId]
          .filter((payment) => {
            if (
              (month && payment.month === month) ||
              (year && payment.month.slice(0, 4) === year)
            )
              return payment;
          })
          .reduce((sum, payment) => sum + +payment.amountPaid, 0);

        if (roomTotal > 0) roomContributions[roomId] = roomTotal;
      });

      const roomIds = Object.keys(roomContributions);
      const roomValues = roomIds.map((id) => roomContributions[id]);

      setPieChartData({
        labels: roomIds,
        datasets: [
          {
            label: "Room Contribution",
            data: roomValues,
            backgroundColor: [
              "#2563eb",
              "#0e9f6e",
              "#f59e0b",
              "#8b5cf6",
              "#ef4444",
              "#06b6d4",
              "#f97316",
              "#10b981",
              "#6366f1",
              "#d946ef",
            ],
            borderWidth: 2,
            borderColor: "#ffffff",
          },
        ],
      });

      localStorage.setItem(
        "liparentRevenueSelectedPropertyRange",
        JSON.stringify({ month, year })
      );
    }
  };

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

      <div className="hero mt-2 d-flex flex-column container-fluid text-center">
        <div className="first d-flex justify-content-center container-fluid">
          <u>
            <h3 className="text-center">
              {selectedPropertyName
                ? `REVENUE REPORT FOR ${selectedPropertyName.toUpperCase()}`
                : "REVENUE REPORT"}
            </h3>
          </u>
        </div>

        <form onSubmit={handleGenerateReport} className="first d-flex justify-content-center container-fluid">
          <div className="duration mt-2">
            <ul className="list-unstyled d-flex font-weight-bolder px-3 py-2 gap-4">
              <div className="d-flex flex-column">
                <label htmlFor="month" className="mr-3">
                  <h5>Month</h5>
                </label>
                <input
                  id="month"
                  type="month"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    if (e.target.value) setYear("");
                  }}
                  disabled={!!year}
                />
              </div>
              <div className="d-flex flex-column">
                <label htmlFor="year" className="mr-3">
                  <h5>Year</h5>
                </label>
                <input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    if (e.target.value) setMonth("");
                  }}
                  disabled={!!month}
                />
              </div>
              <div className="d-flex align-items-center">
                <button type="submit" className="btn btn-success">
                  Generate Report
                </button>
              </div>
            </ul>
          </div>
        </form>

        <Toast type="error" message={error} onClose={() => setError("")} />
        <Toast type="success" message={message} onClose={() => setMessage("")} />

        <div className="summary d-flex justify-content-center">
          <div className="card mx-2">
            <div className="card-header">
              <h5>Total Revenue</h5>
            </div>
            <div
              className={`card-body ${
                totalRevenue < projectedRevenue ? "text-danger" : "text-success"
              }`}
            >
              KES. {totalRevenue.toLocaleString()}
            </div>
          </div>
          <div className="card mx-2">
            <div className="card-header">
              <h5>Projected Amount</h5>
            </div>
            <div className="card-body">KES. {projectedRevenue.toLocaleString()}</div>
          </div>
          <div className="card mx-2">
            <div className="card-header">
              <h5>Deficit Amount</h5>
            </div>
            <div
              className={`card-body ${
                deficitRevenue < 0 ? "text-success" : "text-danger"
              }`}
            >
              {deficitRevenue < 0
                ? `KES. +${deficitRevenue.toLocaleString().slice(1)}`
                : `KES. -${deficitRevenue.toLocaleString()}`}
            </div>
          </div>
        </div>

        {lineChartData && (
          <div className="charts d-flex gap-3 mt-4">
            <div className="card p-3 flex-fill">
              <Line
                data={lineChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
                    title: {
                      display: true,
                      text: "Total vs Projected Revenue by Month",
                      font: { size: 13 },
                    },
                  },
                  scales: {
                    x: { title: { display: true, text: "Month", font: { size: 11 } } },
                    y: {
                      title: { display: true, text: "Revenue (KES)", font: { size: 11 } },
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
            {pieChartData && (
              <div className="card p-3 flex-fill">
                <Pie
                  data={pieChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } },
                      title: {
                        display: true,
                        text: "Room Contribution",
                        font: { size: 13 },
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}