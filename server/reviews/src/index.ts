import express, { Request, Response, NextFunction } from 'express';
import { Driver_Review, Restaraunt_Review, Restaurant, Food, Driver, User } from './types/dataTypes';
import { MongoClient } from 'mongodb';
import { ObjectId } from 'mongodb';
import jwt, { JwtPayload } from "jsonwebtoken";
import cors from "cors";
import logger from "morgan";
import axios from 'axios';

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

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (token === undefined) {
    res.status(400).json({ message: "token is missing from header" });
    return
  }
  try {
    if (process.env.ACCESS_TOKEN === undefined) {
      res.status(500).json({ message: "access _token string missing" });
      return;
    }
    const user: string | JwtPayload = jwt.verify(token, process.env.ACCESS_TOKEN) as { _id: string, iat: number };
    req.body.userId = user._id;
    next();
  }
  catch (err) {
    res.status(500).json("token error")
    return
  }
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
          _id: new ObjectId(_id),
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
    if(type === "RestaurantCreated"){

      try{
        const {_id, name, address, type, foods} = data;
        const db = mongo.db();
        const restaurants = db.collection('restaurants');
  
        const restaurant: Restaurant = {
          _id: new ObjectId(_id),
          name,
          address,
          type,
          foods
        }

        await restaurants.insertOne(restaurant);
        res.status(201).send({"message": "Restaurant Created"});
        return;
      }
      catch (err: any) {
        res.status(500).send({error: err.message});
      }

    }

    //listening for UserCreated
    if(type === "UserCreated"){

      const {_id, name, address, email, doNotDisturb}: {_id: ObjectId, name: string, address: string, email: string, doNotDisturb: boolean} = data;
      const db = mongo.db();

      try{
        //adding user to users collection
        const users = db.collection('users');
        const user: User = {
          _id: new ObjectId(_id),
          name,
          address,
          email,
          doNotDisturb
        };

        await users.insertOne(user);
        res.status(201).send({"message": "User Created"});
        return;
      }
      catch (err: any) {
        res.status(500).send({error: err.message});
      }
    }
  });

  //CREATING NEW REVIEW FOR DRIVERID
  app.post('/api/reviews/driver/create', verifyToken, async (req: Request, res: Response) => {
    const { userId, driverId, content, rating} : {userId: ObjectId, driverId: ObjectId, content: string, rating: number} = req.body;

    if(userId == null || driverId == null || content == null || rating == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    try{
      const db = mongo.db();

      //checking is driverId is valid
      const drivers = db.collection('drivers');
      const driver = drivers.findOne({_id: new ObjectId(driverId)});
      if(!driver){
        res.status(404).send({message: "Driver does not exist"});
        return;
      }

      //checking is userId is valid
      const users = db.collection('users');
      const user = users.findOne({_id: new ObjectId(userId)});
      if(!user){
        res.status(404).send({message: "User does not exist"});
        return;
      }

      const reviews = db.collection('driver_reviews');
      const _id = new ObjectId();
      const review: Driver_Review = {
        _id,
        userId: new ObjectId(userId),
        driverId: new ObjectId(driverId),
        content,
        rating
      }
      await reviews.insertOne(review);

      const DriverReviewCreated = {
        type: "DriverReviewCreated",
        data: review
      }

      await axios.post('http://eventbus:4000/events', DriverReviewCreated);

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
  app.post('/api/reviews/restaurant/create', verifyToken, async (req: Request, res: Response) => {
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
        userId: new ObjectId(userId),
        restaurantId: new ObjectId(userId),
        content,
        rating
      };
      
      await reviews.insertOne(review);

      const RestaurantReviewCreated = {
        type: "RestaurantReviewCreated",
        data: review
      }

      await axios.post('http://eventbus:4000/events', RestaurantReviewCreated);

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
  app.get('/api/reviews/driver/get/:driverId', async (req: Request, res: Response) => {
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
  app.get('/api/reviews/restaurant/get/:restaurantId', async (req: Request, res: Response) => {
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

  const event_sub = ["UserCreated", "DriverCreated", "RestaurantCreated"];
  const event_URL = "http://reviews:4010/events";

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: event_sub,
    URL: event_URL
  });
  
  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });

}

start();

// {
//   "type": "UserCreated",
//   "data":{
//     "_id": "eac6131b4f5d34caa897ed35",
//     "name": "nolan",
//     "address": "37 bruh street, italy",
//     "email": "nolaniscool@gmail.com",
//     "doNotDisturb": "false" 
//   }
// }

// {
//   "type": "RestaurantCreated",
//   "data":{
//    "_id": "b95ac011e6d852a59f7a4ebf",
//    "name": "Mama mias",
//    "address": "37 bruh street, italy",
//    "type": "Italian",
//    "foods": []         
//   }
// }

// {
//   "type": "DriverCreated",
//   "data":{
//    "_id": "ea82d6bc3bffbba733efe09f",
//    "name": "Kyle",
//    "email": "bruhmoma@gmail.com"
//    "doNotDisturb": "false"     
//   }
// }