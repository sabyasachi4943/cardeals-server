const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  ObjectID,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hiw3ljn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {

    const carsCollection = client.db("cardeals").collection("cars");
    const usersCollection = client.db("cardeals").collection("users");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    // insert users
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      // TODO: make sure you do not enter duplicate user email
      // only insert users if the user doesn't exist in the database
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    
  } finally {
    
  }
}

run().catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("cardeals server is running");
});

app.listen(port, () => {
  console.log(`cardeals server running on ${port}`);
});
