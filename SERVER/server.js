const express = require("express");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5501" || "http://127.0.0.1:5501",
  }));

// =

app.listen(4000, () => {
  console.log("server running...");
});
