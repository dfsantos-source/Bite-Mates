import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { initRestaurants } from './initData';
import { ObjectId } from 'mongodb';
import { Restaurant, Food } from './types/dataTypes';
import axios from 'axios';
import cors from 'cors';
import logger from 'morgan';

const app = express();
app.use(express.json());
app.use(logger('dev'));
app.use(cors);

const port = 4008;

console.log(process.env.DATABASE_URL);

async function connectDB(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URL;

  if (uri === undefined) {
    throw Error('DATABASE_URL environment variable is not specified');
  }

  const mongo = new MongoClient(uri);
  await mongo.connect();
  return await Promise.resolve(mongo);
}


async function initDB(mongo: MongoClient) {
  const db = mongo.db();

  if (await db.listCollections({ name: 'restaurants' }).hasNext()) {
    console.log('Collection already exists. Skipping initialization.');
    return;
  }

  const products = db.collection('restaurants');
  const result = await products.insertMany(initRestaurants);

  console.log(`Initialized ${result.insertedCount} products`);
  console.log(`Initialized:`);

  for (let key in result.insertedIds) {
    console.log(`  Inserted product with ID ${result.insertedIds[key]}`);
  }
}

async function start() {
  const mongo = await connectDB();
  await initDB(mongo)

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  //creating restaurant document
  app.post('/api/restaurants/create', async (req: Request, res: Response) =>{
    const {name, address, type}: {name: string, address: string, type: string} = req.body;

    if(name == null || address == null || type == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }

    try{
      const db = mongo.db();
      const restaurants = db.collection('restaurants');
      const _id = new ObjectId();
      const foods: Food[] = [];
      const restaurant: Restaurant = {
        _id,
        name,
        address,
        type,
        foods
      }

      await restaurants.insertOne(restaurant);

      //Pushing event to the eventbus
      await axios.post(`http://eventbus:4000/events`, {

        type: 'RestaurantCreated',
        data: {
            restaurantId: _id,
            name,
            address,
            type,
            foods
        },

      });

      //Send as response to user
      res.status(201).send({
        message: "Restaurant successfully registered",
        _id,
        name,
        address,
        type,
        foods
      });

      return;
    }
    catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  app.post('/api/restaurants/foods/create', async (req: Request, res: Response) =>{
    const {name, price, restaurantId}: {name: string, price: number, restaurantId: ObjectId} = req.body;

    if(name == null || price == null || restaurantId == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(restaurantId)) {
      res.status(400).send({message: "restaurantId is not a valid mongo Id"});   
      return;
    }
    try{
      const db = mongo.db();
      const restaurants_db = db.collection('restaurants');
      const restaurant = await restaurants_db.findOne({"_id" : new ObjectId(restaurantId)});

      if (!restaurant) {
        res.status(404).send({message: "Restaurant not found"});
        return;
      }

      const _id = new ObjectId();
      const food: Food = {
        _id,
        name,
        price,
        restaurantId
      }

      const {foods}: {foods: Food[]} = restaurant;
      foods.push(food);

      await restaurants_db.updateOne({"_id" : new ObjectId(restaurantId)}, {$set : {foods: foods}});

      res.status(201).send({
        message: "Food successfully registered",
        _id,
        name,
        price,
        restaurantId
      })

      //Pushing event to the eventbus
      await axios.post(`http://eventbus:4000/events`, {

        type: 'FoodCreated',
        data: {
            FoodId: _id,
            name,
            price,
            restaurantId
        },

      });

    }
    catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  app.get('/api/restaurants/get/all', async (req: Request, res: Response) =>{
    try{
      const db = mongo.db();
      const restaurants_doc = db.collection('restaurants');
      const restaurants = await restaurants_doc.find().toArray();

      if (!restaurants) {
        res.status(404).send({message: "No restaurants found"});
        return;
      }

      res.status(201).send({restaurants});
      return;
    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.get('/api/restaurants/get/:restaurantId', async (req: Request, res: Response) =>{
    const {restaurantId} = req.params;

    if (restaurantId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(restaurantId)) {
      res.status(400).send({message: "restaurantId is not a valid mongo Id"});   
      return;
    }
    try {
      const db = mongo.db();
      const restaurants_doc = db.collection('restaurants');
      const restaurant = await restaurants_doc.findOne({"_id" : new ObjectId(restaurantId)});

      if (!restaurant) {
        res.status(404).send({message: "Restaurant not found"});
        return;
      }

      const {_id, name, address, type, foods}: {_id: ObjectId, name: string, address: string, type: string, foods: Food[]} = restaurant;
      res.status(201).send({
        _id,
        name,
        address,
        type,
        foods
      });

      return;

    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.get('api/restaurants/foods/get/:restaurantId', async (req: Request, res: Response) =>{
    const {restaurantId} = req.params;

    if (restaurantId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(restaurantId)) {
      res.status(400).send({message: "restaurantId is not a valid mongo Id"});   
      return;
    }
    try{
      const db = mongo.db();
      const restaurants_doc = db.collection('restaurants');
      const restaurant = await restaurants_doc.findOne({"_id" : new ObjectId(restaurantId)});

      if (!restaurant) {
        res.status(404).send({message: "Restaurant not found"});
        return;
      }

      const {foods}: {foods: Food[]} = restaurant;
      res.status(201).send({foods});
      return;
    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()