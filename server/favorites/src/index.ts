import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import logger from 'morgan';
import { Favorites, Restaurant } from './types/dataTypes';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(logger('dev'));
app.use(cors);

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

  const mongo = connectDB();

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.post('/events', async (req: Request, res: Response) => {
    const { type, data }: {type: string, data: any} = req.body;

    if(type.length == 0 || type == null){
      res.status(400).json({ err: 'Incomplete type value' });
    }
    if(data == null){
      res.status(400).json({ err: 'Incomplete data' });
    }

    //if a user is created, 
    if(type === "UserCreated"){

      const {userId, name, address, email} = data;
      const _id = new ObjectId();
      const restaurant_list: Restaurant[] = [];
      const db = mongo.db();

      //adding favorite to favorites collection
      const favorites = db.collection('favorites');
      const favorite: Favorites ={
        _id,
        userId,
        restaurant_list
      }
      await favorites.insertOne(favorite);

      //adding user to users collection
      const users = db.collection('users');
      const user: User = {
        userId,
        name,
        address,
        email
      }
      await users.insertOne(user);

    }
    else if(type === "RestaurantCreated"){

      const {_id, name, address, type, foods} = data;
      const restaurants = db.collection('restaurants');

      const restaurant: Restaurant = {
        _id,
        name,
        address,
        type,
        foods
      }
      await restaurants.insertOne(restaurant);

    }
    else{
      console.log(req.body.type);
      res.send({});
    }
  });

  app.put('/api/user/favorites/add', async (req: Request, res: Response) => {
    const {userId, restaurantId} : {userId: ObjectId, restaurantId: ObjectId } = req.body;

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
      const user = await reviews.findOne({"userId" : new ObjectId(userId)});
      const {restaurant_list, _id}: {restaurant_list: Restaurant[], _id: ObjectId} = user;

      //grabbing restaurant in coorelation with restaurant collection based on the restaurantId
      const restaurants = db.collection('restaurants');
      const restaurant = await restaurants.findOne({"_id" : new ObjectId(restaurantId)});

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

  app.get('api/user/favorites/get/:userId', async (req: Request, res: Response) => {
    const {userId} : {userId: ObjectId } = req.params;

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
      const users = db.collection('users');
      const user = await users.findOne({'userId': new ObjectId(userId)});

      if (!user) {
        res.status(404).send({message: "User not found"});
        return;
      }

      const list = user.restaurant_list;

      res.status(201).send({list});
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