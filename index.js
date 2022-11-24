const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ikwqeh8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
  try {
    const categoryCollection = client.db('pirates-hut').collection('products-category');
    const productsCollection = client.db('pirates-hut').collection('products');


    //  get categories 
    app.get('/categories', async (req, res) => {
      const query = {}
      const category = await categoryCollection.find(query).toArray();
      res.send(category);

    })

    //  get selected category item
    app.get('/category/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }
      const categoryItems = await categoryCollection.findOne(query);
      res.send(categoryItems)
    })


    //  get products by category

    app.get('/products/:category', async (req, res) => {
      const category = req.params.category;
      console.log(category);
      const query = {
        category: category
      }
      const products = await productsCollection.find(query).toArray();
      res.send(products)
    })














  } finally { }

}


run()




app.get('/', async (req, res) => {
  res.send('Pirates Hut Server Is running')
})

app.listen(port, () => 'Pirates Hut server is running')