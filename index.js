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
  const userAuth = req.headers?.authorization;
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
    const advertiseCollection = client.db('pirates-hut').collection('advertiseitem');
    const wishlistCollection = client.db('pirates-hut').collection('wishlist');
    //  post booked item

    app.post('/bookItem', async (req, res) => {
      const item = req.body;
      const result = await bookedItemCollection.insertOne(item);
      res.send(result)

    })

    // add new products

    app.post('/addproducts', async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result)

    })





    // get my products

    app.get('/myproducts', async (req, res) => {
      const email = req.query?.email;
      const query = {
        email: email
      }

      const result = productsCollection.find(query);
      const myproducts = await result.toArray();
      res.send(myproducts)
    })






    //   add to advertise

    app.put('/addtoadvertise', async (req, res) => {
      const advertiseItem = req.body;
      const id = req.query.id;

      const filter = {
        _id: ObjectId(id)
      }
      const options = { upsert: true };


      const updatedDoc = {
        $set: {
          category: advertiseItem.category,
          location: advertiseItem.location,
          phone: advertiseItem.phone,
          price: advertiseItem.price,
          title: advertiseItem.title,
          description: advertiseItem.description,
          email: advertiseItem.email,
          purchaseyear: advertiseItem.purchaseyear,
          originalprice: advertiseItem.originalprice,
          condition: advertiseItem.condition,
          postdate: advertiseItem.postdate,
          price: advertiseItem.price,
          availibility: advertiseItem.availibility,
          advertise: 'advertised'
        }
      }
      const result = await advertiseCollection.updateOne(filter, updatedDoc, options);

      res.send(result);
    })


    // get all adertised items 
    app.get('/advertisedItem', async (req, res) => {
      const query = {
        advertise: 'advertised'
      }
      const items = await advertiseCollection.find(query).toArray();
      res.send(items)
    })




    // google user login

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
          photoURL: user?.photoURL,
          accountType: 'Buyer'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc, options)
      res.send(result)


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
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
        return res.send({ accessToken: token })
      }
      res.status(403).send({ accessToken: '' });

    })










    // get my orders
    app.get('/myorders', verifyJWT, async (req, res) => {
      const decoded = req.decoded;

      const email = req.query?.email;


      const decodedEmail = req.decoded?.email;
      if (email !== decodedEmail) {
        return res.status(403).send({ message: 'forbidden Access' })
      }
      const query = {
        email: email
      }
      const result = await bookedItemCollection.find(query).toArray();


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

    // get all users

    app.get('/allusers', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const adminemail = { email: decodedEmail };
      const user = await userCollection.findOne(adminemail);
      if (user?.accountType !== 'Admin') {
        return res.status(403).send({ message: 'forbidden access' });
      }
      const query = {};
      console.log('safin');
      const allusers = await userCollection.find(query).toArray();
      res.send(allusers);
    })



    //  get all sellers 
    app.get('/allseller', verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const adminemail = { email: decodedEmail };
      const user = await userCollection.findOne(adminemail);
      if (user?.accountType !== 'Admin') {
        return res.status(403).send({ message: 'forbidden access' });
      }

      const query = {
        accountType: 'Seller'
      };
      const sellers = await userCollection.find(query).toArray();
      res.send(sellers)
    })


    //  verify seller
    app.put('/verifyuser/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = {
        _id: ObjectId(id)
      }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verification: 'Verified'
        }
      }
      // const user = userCollection.find(filter);
      const result = await userCollection.updateOne(filter, updatedDoc, options)
      res.send(result)
    })

    // verify sellerproducts
    app.put('/verifyuserproducts/:email', async (req, res) => {
      const email = req.params.email;
      const filter = {
        email: email
      }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verification: 'Verified'
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc, options);
      res.send(result)
    })
    //add to wishlist
    app.post('/addtowishlist', async (req, res) => {
      const product = req.body;
      const result = await wishlistCollection.insertOne(product);
      res.send(result)
    })

    // update product to wishlist

    app.put('/wishlistproduct/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: ObjectId(id)
      }
      const options = { upsert: true }
      const updatedDoc = {
        $set: {
          wishlist: true
        }
      }
      const result = await productsCollection.updateOne(filter, updatedDoc, options)
      res.send(result);


    })






    // get all buyers
    app.get('/allbuyers', verifyJWT, async (req, res) => {

      const decodedEmail = req.decoded.email;
      const adminemail = { email: decodedEmail };
      const user = await userCollection.findOne(adminemail);
      if (user?.accountType !== 'Admin') {
        return res.status(403).send({ message: 'forbidden access' });
      }

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


    // delete product

    app.delete('/deletemyproduct/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result)
    })

    // delete adveriseprduct

    app.delete('/deleteadvertiseproduct/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const result = await advertiseCollection.deleteOne(filter);
      res.send(result)
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