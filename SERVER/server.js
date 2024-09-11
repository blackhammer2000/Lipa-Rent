require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const { connect } = require("mongoose");

const userRoutes = require("./routes/users/routes/routes");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:4000" || "http://127.0.0.1:4000",
  })
);

app.use(userRoutes);

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT}.`);
});

(async function () {
  try {
    const connection = await connect(process.env.DB_CONNECTION);

    if (connection) console.log("connected to database.");
  } catch (error) {
    if (error) console.log(`Error connecting to database: ${error.message}`);
  }
})();
