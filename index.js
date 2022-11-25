const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ikwqeh8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// verify jwt token

function verifyJWT(req, res, next) {
  console.log('shafin');
  const userAuth = req.headers?.authorization;
  console.log('userAuth', userAuth);
  if (!userAuth) {
    return res.status(401).send('Unauthorized Access')
  }
  const token = userAuth.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (
    err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'forbidden Access' })
    }
    req.decoded = decoded;

    next();
  })

}






async function run() {
  try {
    const categoryCollection = client.db('pirates-hut').collection('products-category');
    const productsCollection = client.db('pirates-hut').collection('products');
    const bookedItemCollection = client.db('pirates-hut').collection('booked-items');
    const userCollection = client.db('pirates-hut').collection('users');

    //  post booked item

    app.post('/bookItem', async (req, res) => {
      const item = req.body;
      const result = await bookedItemCollection.insertOne(item);
      res.send(result)

    })

    // add new products

    app.post('/addproducts', async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result)

    })





    // get my products

    app.get('/myproducts', async (req, res) => {
      const email = req?.query?.email;
      const query = {
        email: email
      }
      const result = productsCollection.find(query);
      const myproducts = await result.toArray();
      res.send(myproducts)
    })


    // create user
    app.post('/createuser', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    })



    // get jwt token 
    app.get('/getjwt', async (req, res) => {
      const email = req.query?.email;
      const query = {
        email: email
      };
      console.log(query);
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
        return res.send({ accessToken: token })
      }
      res.status(403).send({ accessToken: '' });

    })







    app.put('/googlelogin', async (req, res) => {
      let user = req.body;
      const filter = {
        email: user?.email
      }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          name: user.name,
          email: user?.email,
          photoURL: user?.photoURL
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc, options)
      res.send(result)


    })


    // get my orders
    app.get('/myorders', verifyJWT, async (req, res) => {
      console.log('object');
      const email = req.query?.email;
      console.log(email);
      const decodedEmail = req.decoded?.email;
      console.log('decodedEmail', decodedEmail);
      if (email !== decodedEmail) {
        console.log('melenai');
        return res.status(403).send({ message: 'forbidden Access' })
      }
      const query = {
        email: email
      }
      const result = await bookedItemCollection.find(query).toArray();
      console.log(result);


      res.send(result);
    })


    // get  users  
    app.get('/users', async (req, res) => {
      const email = req.query?.email;
      if (email) {
        const query = {
          email: email
        }
        const user = await userCollection.find(query).toArray();
        return res.send(user)
      }
      res.send({ message: 'No Email Found' })
    })

    //  get all sellers 
    app.get('/allseller', async (req, res) => {
      const query = {
        accountType: 'Seller'
      };
      const sellers = await userCollection.find(query).toArray();
      res.send(sellers)
    })

    // get all buyers

    app.get('/allbuyers', async (req, res) => {
      const query = {
        accountType: 'Buyer'
      };
      const buyers = await userCollection.find(query).toArray();
      res.send(buyers)
    })


    //  delete seller
    app.delete('/deleteseller/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    })

    // delete  buyer
    app.delete('/deletebuyer/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const result = await userCollection.deleteOne(filter);
      res.send(result);
    })



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