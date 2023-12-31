const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.48shya3.mongodb.net/?retryWrites=true&w=majority`;

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
    const toyCollection = client.db("toysPortal").collection("toys")
    
    const indexKeys = {category : 1, Name : 1}
    const indexOptions = {name: "nameSub"}

    const result = await toyCollection.createIndex(indexKeys,indexOptions)

    app.get('/updatetoy/:id',async (req,res) =>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await toyCollection.findOne(query);
      res.send(result);
    })

    app.put('/updatetoy/:id',async (req,res) =>{
      const id = req.params.id 
      const filter = {_id : new ObjectId(id)}
      const options = { upsert: true };
      const updatedToy = req.body;
      const toy = {
        $set:{
             quantity:updatedToy.quantity,
             price:updatedToy.price,
             description:updatedToy.description,
        }
      }
      const result = await toyCollection.updateOne(filter,toy,options)
      res.send(result)
    })

    app.get('/toySearch/:text',async (req,res) => {
      const searchText = req.params.text;
      const result = await toyCollection.find({
        $or:[
          {name:{$regex:searchText, $options:"i"}},
          {category: {$regex: searchText, $options:"i"}},
        ]
      }).toArray()
      res.send(result)
    })

    app.get('/singletoy/:id',async(req,res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const options = {
        projection : {_id:0,price:1,}
      }
      const result = await toyCollection.findOne(query)
      res.send(result)
    })

    app.get("/mytoy",async (req,res) =>{
      console.log(req.query.email)
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const toy = await toyCollection.find(query).toArray()
      res.send(toy)
    })

    app.get('/allToys', async (req, res) => {
      let query = {};
      // const sortReq = parseInt(req.query.sort);
      // console.log(typeof(sortReq));
         if (req.query?.email) {
              query = {
                  Email: req.query.email,
              }
          }
          // const options = {
          //     sort: { "price": sortReq },

          // };
      //    const cursor = allToysCollection.find(query, options).limit(20);
         const cursor = toyCollection.find(query).limit(20);

          const result = await cursor.toArray();
          res.send(result);
      })
    //add toy by value
    app.post("/addtoy",async (req,res) => {
        const body = req.body
        if(!body){
            return res.status(404).send({message: "body data not found"})
        }
        const result = await toyCollection.insertOne(body)
        res.send(result)
    })
    // deleted toys
    app.delete('/mytoy/:id',async (req,res) =>{
      const id = req.params.id 
      const query = {_id : new ObjectId(id)}
      const result = await toyCollection.deleteOne(query)
      res.send(result)
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


app.get('/',(req,res) =>{
    res.send('Toy-Shop is Running')
})

app.listen(port,() =>{
    console.log(`Toy-Shop is running on port:${port}`)
})