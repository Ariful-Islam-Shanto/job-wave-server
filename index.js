const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const applyJobCollection = database.collection('appliedJobs')

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
                console.log(query);
            }
            
            const total = jobsCollection.countDocuments();
            const cursor = jobsCollection.find(query);
            const result = await cursor.toArray();
            // console.log("result" , result);
            res.send(result);
        }catch (err) {
            console.log(err);
        }
    }) 

    app.get('/jobById/:id', async (req, res) => {
      try{
        const id = req.params.id;
        const query = {_id : new ObjectId(id)};
        const result = await jobsCollection.findOne(query);
        res.send(result);
      }catch (err) {
        console.log(err);
      }
    }) 

    app.get('/AllJobs', async (req, res) => {
      const jobTitle = req.query.title;
      let query = {};

      if(jobTitle) {
         query.title = jobTitle;
        console.log(jobTitle);
      }

      const cursor = jobsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })

    app.post('/addAJob', async(req, res) => {
      const job = req.body;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    })


    app.post('/addApplyJob', async(req, res) => {
      const applyJob = req.body;
      const result = await applyJobCollection.insertOne(applyJob);
      res.send(result);
    })

    app.patch('/updateApplicants', async (req, res) => {
      const updateData = req.body;
      const query = { _id : new ObjectId(updateData._id)}
      const increase = {
        $inc: { applicants: 1 }
      }
      const result = await jobsCollection.updateOne(query, increase);
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