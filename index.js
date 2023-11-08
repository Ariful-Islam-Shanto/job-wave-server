const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;


//? middleware
app.use(express.json());
app.use(cors({
  origin : ['http://localhost:5173'],
  credentials: true
}));
app.use(cookieParser());


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

    
    //?Middleware
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  //? if there is no token in cookies return from here.

  if(!token) {
      return res.status(401).send({message : 'no token access'});
  }

  //? If there is token then we will continue to verify it.
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if(err) {
          return res.status(401).send({message : 'unauthorized access'});
      }
      req.user = decoded;
      next();
  })
}


    //? Auth api
    app.post('/jwt', async( req, res) => {
      const user = req.body;
     
      //* now generate the token
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const token = jwt.sign(user, secret, {expiresIn : '1h'});
      res
      .cookie('token', token, {
         httpOnly: true,
         secure: true,
         sameSite: 'none'
      })
      .send({success : true});
    })

    app.get('/jobCategories', verifyToken, async(req, res) => {
       
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

    // app.get('/appliedJobs', async(req, res) => {
    //   const email = req.query.email;
    //   const category = req.query.category;
    //   let query = {};
      
    //   if(email && category) {
    //       // query.applicant_email = email; 
    //       query = {applicant_email : email, category : category}
    //       const cursor = applyJobCollection.find(query);
    //       const result = await cursor.toArray();
    //       res.send(result);
    //   }
    //   if(email) {
    //       query.applicant_email = email; 
    //       const cursor = applyJobCollection.find(query);
    //       const result = await cursor.toArray();
    //       res.send(result);
    //   }

    //   res.send({message : 'No data found by this email.'})

    // })
    app.get('/appliedJobs', async (req, res) => {
      const email = req.query.email;
      const category = req.query.category;
      let query = {};
    
      if (email && category) {
        query = { applicant_email: email, category: category };
      } else if (email) {
        query.applicant_email = email;
      } 
        
      const cursor = applyJobCollection.find(query);
      const result = await cursor.toArray();
      // console.log('Query:', query);
      // console.log('Result:', result);
      res.send(result);
    });
    

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

    app.put('/update/:id', async (req, res) => {
        const id = req.params.id;
        const Data = req.body;
        
        const filter = { _id : new ObjectId(id) };
        const updateDoc = {
          $set: {
            name : Data.name,
            email : Data.email,
            title : Data.title,
            category: Data.category,
            salary : Data.salary,
            postDate : Data.postDate,
            deadline : Data.deadline,
            jobBanner : Data.jobBanner,
            applicants : Data.applicants,
            description : Data.description
          },
        };

        const result = await jobsCollection.updateOne(filter, updateDoc);
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