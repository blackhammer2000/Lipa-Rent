require("dotenv").config();

const express = require("express");
const app = express();
const cors = require("cors");
const PORT = process.env.PORT || 8080;
const origin = process.env.ORIGIN;
const { connect } = require("mongoose");

const userRoutes = require("./routes/users/routes/routes");


app.use(express.json());
app.use(
  cors({
    origin,
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
    if (error) console.error(`Error connecting to database: ${error.message}`);
  }
})();


// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://waweruzamuel_db_user:KoGJoLN2vmXu0TvY@cluster0.qhjwfxc.mongodb.net/?appName=Cluster0";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);
