import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import { Favorites, Restaurant, Food, User } from './types/dataTypes';
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

async function start(){

  const mongo = await connectDB();

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

      const {userId, name, address, email, doNotDisturb} = data;
      const _id = new ObjectId();
      const restaurant_list: Restaurant[] = [];
      const db = mongo.db();

      //adding favorite to favorites collection
      const favorites = db.collection('favorites');
      const favorite: Favorites ={
        _id,
        userId: new ObjectId(userId),
        restaurant_list
      }
      await favorites.insertOne(favorite);

      //adding user to users collection
      const users = db.collection('users');
      const user: User = {
        _id: new ObjectId(userId),
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
  });

  app.put('/api/user/favorites/add', async (req: Request, res: Response) => {
    const {userId, restaurantId} : {userId: string, restaurantId: string } = req.body;

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
      //grabbing favorites list from favorites collection based on the userId
      const db = mongo.db();
      const reviews = db.collection('favorites');
      const user_favorite = await reviews.findOne({"userId": new ObjectId(userId)});

      if(user_favorite === null){
        res.status(400).send({message: "Body not complete"});
        return;
      }
      const {restaurant_list, _id} = user_favorite;

      if(restaurant_list == null || _id == null){
        res.status(400).send({message: "Body not complete"});
        return;
      }

      //grabbing restaurant in coorelation with restaurant collection based on the restaurantId
      const restaurants = db.collection('restaurants');
      const restaurant = await restaurants.findOne({"_id" : new ObjectId(restaurantId)}) as Restaurant;

      restaurant_list.push(restaurant);

      await reviews.updateOne({"userId" : new ObjectId(userId)}, {$set : {restaurant_list: restaurant_list}});

      res.status(201).send({
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

  app.get('/api/user/favorites/get/:userId', async (req: Request, res: Response) => {
    const {userId} = req.params;

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