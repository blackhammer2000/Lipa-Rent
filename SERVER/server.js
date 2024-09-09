require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const Mongoose = require("mongoose");

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5502" || "http://127.0.0.1:5502",
  })
);

// =

app.listen(PORT, () => {
  console.log(`server running on PORT ${PORT}.`);
});
try {
  Mongoose.connect(process.env.DB_CONNECTION).then(() => {
    console.log("connected to database.");
  });
} catch (error) {
  if (error) console.log(`Error connecting to database: ${error.message}`);
}
