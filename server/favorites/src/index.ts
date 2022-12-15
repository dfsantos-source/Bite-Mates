import express, { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import { Favorites, Restaurant, Food, User } from './types/dataTypes';
import { initRestaurants } from './initData';
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from 'morgan';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger("dev"));

const port = 4004;

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

async function start(){

  const mongo = await connectDB();
  await initDB(mongo);

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.post('/events', async (req: Request, res: Response) => {
    const event = req.body;
    const {type, data}: {type: string, data: any} = event;

    if(type.length == 0 || type == null){
      res.status(400).json({ err: 'Incomplete type value' });
    }
    if(data == null){
      res.status(400).json({ err: 'Incomplete data' });
    }

    //if a user is created, 
    if(type === "UserCreated"){

      const {_id, name, address, email, doNotDisturb} = data;
      const favoriteId = new ObjectId();
      const restaurant_list: Restaurant[] = [];
      const db = mongo.db();

      //adding favorite to favorites collection
      const favorites = db.collection('favorites');
      const favorite: Favorites ={
        _id: favoriteId,
        userId: new ObjectId(_id),
        restaurant_list
      }
      await favorites.insertOne(favorite);

      //adding user to users collection
      const users = db.collection('users');
      const user: User = {
        _id: new ObjectId(_id),
        name,
        address,
        email,
        doNotDisturb
      }
      await users.insertOne(user);

      res.status(201).send({"message": "User Created"});
      return;

    }
    else if(type === "RestaurantCreated"){

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
    else{
      console.log(req.body.type);
      res.send({});
    }
    res.status(200).json({});
    return;
  });

  app.put('/api/user/favorites/add', verifyToken, async (req: Request, res: Response) => {
    const {userId, restaurantId} : {userId: string, restaurantId: string } = req.body;

    console.log(userId);
    console.log(restaurantId);

    if(userId == null || restaurantId == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if(!ObjectId.isValid(userId)){
      res.status(404).send({message: "userId is not a valid mongo Id"});   
      return;
    }
    if(!ObjectId.isValid(restaurantId)){
      res.status(404).send({message: "restaurantId is not a valid mongo Id"});   
      return;
    }

    try{

      const db = mongo.db();

      //grabbing favorites list from favorites collection based on the userId
      const favorites_db = db.collection('favorites');
      const user_favorite = await favorites_db.findOne({"userId": new ObjectId(userId)});

      console.log(user_favorite);

      if(user_favorite === null){
        res.status(400).send({message: "Body not complete"});
        return;
      }

      const {restaurant_list, _id} = user_favorite;

      if(restaurant_list == null || _id == null){
        res.status(400).send({message: "Body not complete"});
        return;
      }

      //grabbing restaurant in restaurant collection based on the restaurantId
      const restaurants = db.collection('restaurants');
      const restaurant = await restaurants.findOne({"_id" : new ObjectId(restaurantId)}) as Restaurant;

      if(!restaurant){
        res.status(404).send({message: "Restaurant not found"});
        return;
      }

      restaurant_list.push(restaurant);

      await favorites_db.updateOne({"userId" : new ObjectId(userId)}, {$set : {restaurant_list: restaurant_list}});

      res.status(200).send({
        message: "Favorites List Successfully Updated",
        _id,
        userId,
        restaurantId,
        restaurant_list
      })

      return;
    }
    catch (err: any) {
      res.status(500).send({error: err.message});
    }

  });

  app.put('/api/user/favorites/delete', verifyToken, async (req: Request, res: Response) => {
    const {userId, restaurantId} : {userId: string, restaurantId: string } = req.body;

    if(userId == null || restaurantId == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }

    try{
      const db = mongo.db();
      const favorites_db = db.collection('favorites');
      const user_favorite = await favorites_db.findOne({'userId': new ObjectId(userId)}) as Favorites;

      if(!user_favorite){
        res.status(404).send({message: "User Not found"});
        return;
      }

      let {restaurant_list} = user_favorite;
      const favorites_size = restaurant_list.length;

      restaurant_list = restaurant_list.filter((r: Restaurant) => {
        return r._id.toString().localeCompare(restaurantId.toString()) != 0
      });

      //cheking if one was deleted, meaning the restaurant was found
      if(favorites_size == restaurant_list.length){
        res.status(404).send({message: "Restaurant Not Found"});
        return;
      }
      
      await favorites_db.updateOne({"userId" : new ObjectId(userId)}, {$set : {restaurant_list: restaurant_list}});

      res.status(200).send({message: "Element successfully removed"});
    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  })

  app.get('/api/user/favorites/get', verifyToken, async (req: Request, res: Response) => {
    const {userId} = req.body;

    if(userId == null){
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if(!ObjectId.isValid(userId)){
      res.status(404).send({message: "userId is not a valid mongo Id"});   
      return;
    }
    try{
      const db = mongo.db();
      const users = db.collection('favorites');
      const user = await users.findOne({'userId': new ObjectId(userId)}) as Favorites;

      if (!user) {
        res.status(404).send({message: "User not found"});
        return;
      }

      const list = user.restaurant_list;

      res.status(200).send({list});
      return;
    }
    catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  const event_sub = ["UserCreated", "RestaurantCreated"];
  const event_URL = "http://favorites:4004/events";

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
//     "email": "nolaniscool@gmail.com"
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