import express, { Request, Response } from 'express';
import { Driver_Review, Restaraunt_Review, Restaurant, Food, Driver, User } from './types/dataTypes';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import cors from "cors";
import logger from "morgan";

const app = express();
app.use(express.json());
app.use(cors());
app.use(logger('dev'));

const port = 4010;

// REVIEW SERVICE
async function connectDB(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URL;

  if (uri === undefined) {
    throw Error('DATABASE_URL environment variable is not specified');
  }

  const mongo = new MongoClient(uri);
  await mongo.connect();
  return await Promise.resolve(mongo);
}

async function start() {
  const mongo = await connectDB();

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.post('/events', async (req: Request, res: Response) => {

    const event = req.body;
    const {type, data}: {type: string, data: any} = event;

    //listening for DriverCreated
    if(type == "DriverCreated"){

      const {_id, name, email, doNotDisturb}: {_id: ObjectId, name: string, email: string, doNotDisturb: boolean} = data;
      try{
        const db = mongo.db();
        const drivers_db = db.collection('drivers');
        const driver: Driver = {
          _id,
          name,
          email,
          doNotDisturb,
        }
  
        await drivers_db.insertOne(driver);
        res.status(200).send({"message": "driver successfully created"});
        return;
        
      }
      catch (err: any) {
        res.status(500).send({error: err.message});
      }
    }

    //listening for RestaurantCreated
    if(type == "RestaurantCreated"){

      const {_id, name, address, type, foods}: {_id: ObjectId, name: string, address: string, type: string, foods: Food[]} = data;
      try{
        const db = mongo.db();
        const restaurants_db = db.collection('restaurants');
        const restaurant: Restaurant = {
          _id,
          name,
          address,
          type,
          foods
        }
  
        await restaurants_db.insertOne(restaurant);
        res.status(200).send({"message": "restaurant successfully created"});
        return;
      }
      catch (err: any) {
        res.status(500).send({error: err.message});
      }
    }

    //listening for UserCreated
    if(type == "UserCreated"){
      const {_id, name, email, address, doNotDisturb}: {_id: ObjectId, name: string, email: string, address: string, doNotDisturb: boolean} = data;
      try{
        const db = mongo.db();
        const users_db = db.collection('users');
        const user: User = {
          _id,
          name,
          email,
          address,
          doNotDisturb
        }
        await users_db.insertOne(user);
        res.status(200).send({"message": "User successfully created"});
        return;
      }
      catch (err: any) {
        res.status(500).send({error: err.message});
      }
    }
  });

  //CREATING NEW REVIEW FOR DRIVERID
  app.post('/api/reviews/driver/create', async (req: Request, res: Response) => {
    const { userId, driverId, content, rating} : {userId: ObjectId, driverId: ObjectId, content: string, rating: number} = req.body;
    if(userId == null || driverId == null || content == null || rating == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    try{
      const db = mongo.db();

      //checking is driverId is valud
      const drivers = db.collection('drivers');
      const driver = drivers.findOne({_id: new ObjectId(driverId)});
      if(!driver){
        res.status(404).send({message: "Driver does not exist"});
        return;
      }

      const reviews = db.collection('driver_reviews');
      const _id = new ObjectId();
      const review: Driver_Review = {
        _id,
        userId,
        driverId,
        content,
        rating
      }
      await reviews.insertOne(review);

      res.status(201).send({
        message: "Review successfully registered",
        _id,
        userId,
        driverId,
        content,
        rating
      });

      return;
    }
    catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  //CREATING NEW REVIEW FOR RESTAURANTID
  app.post('/api/reviews/restaurant/create', async (req: Request, res: Response) => {
    const { userId, restaurantId, content, rating} : {userId: ObjectId, restaurantId: ObjectId, content: string, rating: number} = req.body;
    if(userId == null || restaurantId == null || content == null || rating == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    try{
      const db = mongo.db();

      //checking whether restaurant exists given restaurantId
      const restaurants_db = db.collection('restaurants');
      const restaurant = restaurants_db.findOne({_id: new ObjectId(restaurantId)});
      if(!restaurant){
        res.status(404).send({message: "Restaurant does not exist"});
        return;
      }

      const reviews = db.collection('restaurant_reviews');
      const _id = new ObjectId();
      const review: Restaraunt_Review = {
        _id,
        userId,
        restaurantId,
        content,
        rating
      };
      
      await reviews.insertOne(review);

      res.status(201).send({
        message: "Review successfully registered",
        _id,
        userId,
        restaurantId,
        content,
        rating
      });

      return;
    }
    catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  //GETTING REVIEWS BASED ON DRIVERID
  app.get('api/reviews/driver/get/:driverId', async (req: Request, res: Response) => {
    const { driverId } = req.params;

    if (driverId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).send({message: "driverId is not a valid mongo Id"});   
      return;
    }

    try{
      const db = mongo.db();
      const driver_reviews = db.collection('driver_reviews');
      const reviews = await driver_reviews.find({'driverId': new ObjectId(driverId)}).toArray();

      if (!reviews) {
        res.status(404).send({message: "No driver found"});
        return;
      }

      res.status(200).send({reviews});
      return;
    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }

  });

  //GETTING REVIEWS BASED ON RESTAURANTID
  app.get('api/reviews/restaurant/get/:restaurantId', async (req: Request, res: Response) => {
    const { restaurantId } = req.params;

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
      const restaurant_reviews = db.collection('restaurant_reviews');
      const reviews = await restaurant_reviews.find({"restaurantId": new ObjectId(restaurantId)}).toArray();

      if (!reviews) {
        res.status(404).send({message: "No restaurant found"});
        return;
      }

      res.status(200).send({reviews});
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

start();