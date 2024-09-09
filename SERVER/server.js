require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const { connect } = require("mongoose");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5501" || "http://127.0.0.1:5501",
  })
);

// =

app.listen(PORT, () => {
  console.log(`server running. on PORT ${PORT}.`);
});

connect(process.env.DB_CONNECTION, () => {
  console.log("connected to database.");
});
