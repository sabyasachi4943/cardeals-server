const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");

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
    const ordersCollection = client.db("cardeals").collection("orders");

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });


    // find all cars in category
    app.get("/category/:type", async (req, res) => {
      const type = req.params.type;
      const query = { type: type };
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    })

    // get orders by email
    app.get("/orders", async (req, res) => {
      const email = req.query.email;
      // const decodedEmail = req.decoded.email;

      // if (email !== decodedEmail) {
      //   return res.status(403).send({ message: "forbidden access" });
      // }

      const query = { buyerEmail: email };
      const orders = await ordersCollection.find(query).toArray();
      res.send(orders);
    });

    // orders
    app.post("/orders", async (req, res) => {
      const buyerOrder = req.body;
      console.log(buyerOrder);
      const query = {
        orderCarId: buyerOrder.orderCarId,
        buyerEmail: buyerOrder.buyerEmail,
        carName: buyerOrder.carName,
      };

      const alreadyOrdered = await ordersCollection.find(query).toArray();

      if (alreadyOrdered.length) {
        const message = `You ${buyerOrder.buyerEmail} already have ordered ${buyerOrder.carName}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await ordersCollection.insertOne(buyerOrder);
      res.send(result);
    });


    // get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // get buyers
    app.get("/buyers", async (req, res) => {
      const query = { role: "buyer"};
      const buyers = await usersCollection.find(query).toArray();
      res.send(buyers);
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


    // seller check
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    // seller inserting products
    app.post("/products", verifyJWT, async (req, res) => {
      const car = req.body;
      const result = await carsCollection.insertOne(car);
      res.send(result);
    });
    // sellers my product
    app.get("/products", async (req, res) => {
      const name = req.query.name;
      const query = { sellerName: name };
      const result = await carsCollection.find(query).toArray();
      res.send(result);
    });


    // admin check
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options,
      );
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
