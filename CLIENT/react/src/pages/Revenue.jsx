import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { readAllProperties, readAllPaymentsForRevenue } from "../services/api";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const [chartData, setChartData] = useState(null);
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

      let allPayments = [];
      for (const roomId in result.propertyRents) {
        for (const tenantId in result.propertyRents[roomId]) {
          allPayments = [...allPayments, ...result.propertyRents[roomId][tenantId]];
        }
      }

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

      // Prepare chart data
      const months = [...new Set(selectedRangePayments.map((p) => p.month))].sort();
      const amounts = months.map((m) => {
        return selectedRangePayments
          .filter((p) => p.month === m)
          .reduce((sum, p) => sum + +p.amountPaid, 0);
      });

      setChartData({
        labels: months,
        datasets: [
          {
            label: "Revenue",
            data: amounts,
            backgroundColor: "rgba(40, 167, 69, 0.6)",
            borderColor: "rgba(40, 167, 69, 1)",
            borderWidth: 1,
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
                ? `REVENUE REPORT FOR ${selectedPropertyName}`
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

        {error && <div className="alert alert-danger alert-dismissible fade show">{error}
           <button onClick={() => setError("")} type="button" className="close" data-dismiss="alert">
            <span>&times;</span>
          </button></div>}
        {message && <div className="alert alert-success alert-dismissible fade show" role="alert">
          {message}
          <button onClick={() => setMessage("")} type="button" className="close" data-dismiss="alert">
            <span>&times;</span>
          </button>
        </div>}

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

        {chartData && (
          <div className="charts mt-4">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Revenue by Month" },
                },
              }}
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}