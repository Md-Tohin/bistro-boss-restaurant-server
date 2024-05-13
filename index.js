const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productCollection = client.db("bistroBossRestaurantDB").collection("products");
    const reviewCollection = client.db("bistroBossRestaurantDB").collection("reviews");
    const menuCollection = client.db("bistroBossRestaurantDB").collection("menu");
    const cartCollection = client.db("bistroBossRestaurantDB").collection("carts");

    app.get('/api/reviews', async(req, res) => {
        const result = await reviewCollection.find().toArray();
        res.send(result);
    });

    app.get('/api/menu', async(req, res) => {
        const result = await menuCollection.find().toArray();
        res.send(result);
    });

    //  get cart items
    app.get('/api/carts', async(req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    //  store cart item
    app.post('/api/carts', async(req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api
app.get('/', (req, res) => {
    res.send("Module 64 Server");
});

app.listen(port, () => {
    console.log(`Module 64 server is running on port ${port}`);
});
