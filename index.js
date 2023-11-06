const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//? middleware
app.use(express.json());
app.use(cors());


app.get('/', async(req, res) => {
    res.send(`App is running on port ${port}`);
})



const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.USER_PASS}@cluster0.agg5tyw.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    // Send a ping to confirm a successful connection

    const database = client.db('JobsDB');
    const jobsCollection = database.collection('jobCategory');

    app.get('/jobCategories', async(req, res) => {
       
        try{
          const email = req.query.email;
            const categoryName = req.query.category;
            //  console.log('category name', categoryName);
    
           
            let query = {};

            if(email) {
              query.email = email;
            }
    
            if(categoryName) {
                query.category = categoryName;
                // console.log(query);
            }
            
            const total = jobsCollection.countDocuments();
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
    
            res.send(result);
        }catch (err) {
            console.log(err);
        }
    }) 

    app.post('/addAJob', async(req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})