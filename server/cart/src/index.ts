import express, { Request, Response } from 'express';
import { MongoClient } from 'mongodb';
import { Cart, CartItem, Food } from './types/dataTypes';
import { ObjectId } from 'mongodb';
import axios from 'axios';
import cors from 'cors';
import { createSecretKey } from 'crypto';
import logger from 'morgan';

const app = express();

app.use(express.json());
app.use(cors());
app.use(logger('dev'));

const port = 4003;

// CART SERVICE

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

async function start() {
  const mongo = await connectDB();

  app.post('/api/cart/create', async (req: Request, res: Response) => {
    const { userId }: { userId: string } = req.body;
    if (userId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db = mongo.db();
    const carts = db.collection('carts');
    const _id = new ObjectId();
    const cart: Cart = {
      _id,
      userId: new ObjectId(userId),
      items: []
    }
    try {
      await carts.insertOne(cart);
      res.status(201).send(cart);      
    } catch (err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.get('/api/cart/get/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (userId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db = mongo.db();
    const carts = db.collection('carts');
    try {
      const cart = await carts.findOne({"userId" : new ObjectId(userId)});
      if (!cart) {
        res.status(404).send({message: `Cart not found`});
        return;
      }
      res.status(200).send(cart);
      return;
    } catch(err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.put('/api/cart/add', async (req: Request, res: Response) => {
    const { userId, food }: { userId: string, food: Food } = req.body;
    if (userId == null || food == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db = mongo.db();
    const carts = db.collection('carts');
    try {
      const cartDB = await carts.findOne({"userId" : new ObjectId(userId)});
      if (!cartDB) {
        res.status(400).send({message: "Cart not found"});
        return;
      }
      const cartId = cartDB._id;
      for (let i=0; i<cartDB.items.length; ++i) {
        if (cartDB.items[i].foodId.toString().toLowerCase() === food._id.toString().toLowerCase()) {
          cartDB.items[i].quantity += 1;
          const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : cartDB.items } }, {returnDocument: "after"});
          res.status(200).send(updatedCart.value);
          return;
        }
      }
      const cartItem: CartItem = {
        _id: new ObjectId(),
        foodId: new ObjectId(food._id),
        name: food.name,
        price: food.price,
        restaurantId: new ObjectId(food.restaurantId),
        quantity: 1
      }
      cartDB.items.push(cartItem);
      const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : cartDB.items } }, {returnDocument: "after"});
      res.status(200).send(updatedCart.value);
      return;
    } catch(err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.put('/api/cart/remove/:cartId/:itemId', async (req: Request, res: Response) => {
    const { cartId, itemId } = req.params;
    if (cartId == null || itemId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(cartId) || !ObjectId.isValid(itemId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db = mongo.db();
    const carts = db.collection('carts');
    try {
      const cartDB = await carts.findOne({"_id" : new ObjectId(cartId)});
      if (!cartDB) {
        res.status(400).send({message: "Cart not found"});
        return;
      }
      const items = cartDB.items;
      const updatedItems = items.filter((item: CartItem) => {
        return item._id.toString() !== itemId;
      });
      if (!(updatedItems.length < items.length)) {
        res.status(400).send({message: "Item not found"});
        return;
      }
      const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : updatedItems } }, {returnDocument: "after"});
      res.status(200).send(updatedCart.value);
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.put('/api/cart/edit/quantity/:cartId/:itemId', async (req: Request, res: Response) => {
    const { cartId, itemId } = req.params;
    const { quantity } = req.body;
    if (cartId == null || itemId == null || quantity == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(cartId) || !ObjectId.isValid(itemId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db = mongo.db();
    const carts = db.collection('carts');
    try {
      const cartDB = await carts.findOne({"_id" : new ObjectId(cartId)});
      if (!cartDB) {
        res.status(400).send({message: "Cart not found"});
        return;
      }
      const items = cartDB.items;
      for (let i=0; i<items.length; ++i) {
        if (items[i]._id.toString() === itemId) {
          items[i].quantity = quantity;
          const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : items} }, {returnDocument: "after"});
          res.status(200).send(updatedCart.value);
          return;
        }
      }
      res.status(404).send({message: `Item not found`});
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();