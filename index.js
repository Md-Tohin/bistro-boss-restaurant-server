const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//  middleware
app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017";
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zvhaxau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("bistroBossRestaurantDB").collection("users");
    const productCollection = client.db("bistroBossRestaurantDB").collection("products");
    const reviewCollection = client.db("bistroBossRestaurantDB").collection("reviews");
    const menuCollection = client.db("bistroBossRestaurantDB").collection("menu");
    const cartCollection = client.db("bistroBossRestaurantDB").collection("carts");
    const menuItemCollection = client.db("bistroBossRestaurantDB").collection('menuItems')

    //  reviews related api
    app.get("/api/reviews", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    //  jwt token
    app.post("/api/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //  middleware
    const verifyToken = (req, res, next) => {
      // const token = req.headers.authorization;
      if (!req.headers?.authorization) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
            console.log(err);
            return res.status(401).send({ message: "Unauthorized access" });
          }
          req.decoded = decoded;
          next();
        });
      }
    };

    //  verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      // console.log("email 85 : ", email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      // console.log("inside verify admin hook: ", user);
      const isAdmin = user?.role == "Admin";
      if (!isAdmin) {
        return res.status(403).send("Forbidden access: 90");
      }
      next();
    };

    //  get  users
    app.get("/api/users", verifyToken, verifyAdmin, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    //  find user
    app.get("/api/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access check" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role == "Admin";
      }
      res.send({ admin });
    });

    //  user create
    app.post("/api/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExistsEmail = await userCollection.findOne(query);
      if (isExistsEmail) {
        return res.send({
          message: "User email already exists",
          insertedId: null,
        });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    //  user delete
    app.delete("/api/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });
    //  update role
    app.patch("/api/users/:id", async (req, res) => {
      const id = req.params.id;
      const userInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: userInfo?.role,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //  get cart items
    app.get("/api/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    //  store cart item
    app.post("/api/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });
    //  cart item delete
    app.delete("/api/cart/:id/:email", async (req, res) => {
      const id = req.params.id;
      const email = req.params.email;
      const query = {
        $and: [{ email: email }, { _id: new ObjectId(id) }],
      };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });

    //  menu related api
    app.get("/api/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    //  find menu item api
    app.get("/api/menu/:id", async(req, res) => {
      const id = req.params.id;
      const query = { _id: id };
      const result = await menuCollection.findOne(query);
      res.send(result);
    });

    //  menu item add
    app.post("/api/menu", async(req, res) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });

    //  update menu item
    app.put("/api/menu/:id", async(req, res) => {
      const requestData = req.body;
      const filter = { _id: req.params.id };
      const updateDoc = {
        $set: {
          name: requestData.name,
          price: requestData.price,
          category: requestData.category,
          recipe: requestData.recipe,
          image: requestData.image,
          delete_image_url: requestData.delete_image_url,
        }
      }
      const result = await menuCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //  delete menu item
    app.delete("/api/menu/:id", async(req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id)};
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api
app.get("/", (req, res) => {
  res.send("Module 64 Server");
});

app.listen(port, () => {
  console.log(`Module 64 server is running on port ${port}`);
});
