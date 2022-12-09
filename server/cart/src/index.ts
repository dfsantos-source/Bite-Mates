import express, { Request, Response } from 'express';
import { Collection, Db, Document, ModifyResult, MongoClient, WithId } from 'mongodb';
import { Cart, CartItem, Food, User, Restaurant } from './types/dataTypes';
import { initRestaurants } from './initData';
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
  const uri: string | undefined = process.env.DATABASE_URL;

  if (uri === undefined) {
    throw Error('DATABASE_URL environment variable is not specified');
  }

  const mongo: MongoClient = new MongoClient(uri);
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
}

async function createCartDB(mongo: MongoClient, req: Request, res: Response): Promise<Cart | undefined> {
  const { userId }: { userId: string } = req.body;
  if (userId == null) {
    res.status(400).send({message: "Body not complete"});
    return;
  }
  if (!ObjectId.isValid(userId)) {
    res.status(400).send({message: "Id is not a valid mongo ObjectId"});
    return;
  }
  const db: Db = mongo.db();
  const carts: Collection<Document> = db.collection('carts');
  const _id: ObjectId = new ObjectId();
  const cart: Cart = {
    _id,
    userId: new ObjectId(userId),
    items: []
  }
  try {
    await carts.insertOne(cart);
    return cart;  
  } catch (err: any) {
    res.status(500).send({error: err.message});
    return;
  }
}

async function removeFoodDB(mongo: MongoClient, req: Request, res: Response): Promise<WithId<Document> | null | undefined> {
  const cartId = req.params['cartId'];
  const foodId = req.params['foodId'];
  if (cartId == null || foodId == null) {
    res.status(400).send({message: "Body not complete"});
    return;
  }
  if (!ObjectId.isValid(cartId) || !ObjectId.isValid(foodId)) {
    res.status(400).send({message: "Id is not a valid mongo ObjectId"});
    return;
  }
  const db: Db = mongo.db();
  const carts: Collection<Document> = db.collection('carts');
  try {
    const cartDB: WithId<Document> | null = await carts.findOne({"_id" : new ObjectId(cartId)});
    if (!cartDB) {
      res.status(400).send({message: "Cart not found"});
      return;
    }
    const items: CartItem[] = cartDB.items;
    const updatedItems: CartItem[] = items.filter((item: CartItem): boolean => {
      return item.foodId.toString() !== foodId.toLowerCase();
    });
    if (!(updatedItems.length < items.length)) {
      res.status(400).send({message: "Food not found"});
      return;
    }
    const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : updatedItems } }, {returnDocument: "after"});
    return updatedCart.value;
  } catch (err: any) {
    res.status(500).send({error: err.message});
    return;
  }
}

async function getCartDB(mongo: MongoClient, req: Request, res: Response): Promise<WithId<Document> | undefined> {
  const userId: string = req.params['userId'];
  if (userId == null) {
    res.status(400).send({message: "Body not complete"});
    return;
  }
  if (!ObjectId.isValid(userId)) {
    res.status(400).send({message: "Id is not a valid mongo ObjectId"});
    return;
  }
  const db: Db = mongo.db();
  const carts: Collection<Document> = db.collection('carts');
  try {
    const cart: WithId<Document> | null = await carts.findOne({"userId" : new ObjectId(userId)});
    if (!cart) {
      res.status(404).send({message: `Cart not found`});
      return;
    }
    return cart;
    return;
  } catch(err: any) {
    res.status(500).send({error: err.message});
    return;
  }
}

async function start() {
  const mongo = await connectDB();

  await initDB(mongo);

  app.post('/api/cart/create', async (req: Request, res: Response) => {
    const cart = await createCartDB(mongo, req, res);
    res.status(200).send(cart);
    return;
  });

  // TODO: auth needed
  app.get('/api/cart/get/:userId', async (req: Request, res: Response) => {
    const cart = await getCartDB(mongo, req, res);
    res.status(200).send(cart);
    return;
  });

  // TODO: auth needed
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
      const cartDB: WithId<Document> | null = await carts.findOne({"userId" : new ObjectId(userId)});
      if (!cartDB) {
        res.status(400).send({message: "Cart not found"});
        return;
      }
      const cartId: ObjectId = cartDB._id;
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

  app.put('/api/cart/remove/:cartId/:foodId', async (req: Request, res: Response) => {
    const cart = await removeFoodDB(mongo, req, res);
    res.status(200).send(cart);
    return;
  });

  app.put('/api/cart/edit/quantity/:cartId/:itemId', async (req: Request, res: Response) => {
    const cartId = req.params['cartId'];
    const itemId = req.params['itemId'];
    const { quantity }: {quantity: number} = req.body;
    if (cartId == null || itemId == null || quantity == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(cartId) || !ObjectId.isValid(itemId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db: Db = mongo.db();
    const carts: Collection<Document> = db.collection('carts');
    try {
      const cartDB: WithId<Document> | null = await carts.findOne({"_id" : new ObjectId(cartId)});
      if (!cartDB) {
        res.status(400).send({message: "Cart not found"});
        return;
      }
      const items: CartItem[] = cartDB.items;
      for (let i=0; i<items.length; ++i) {
        if (items[i]._id.toString() === itemId) {
          items[i].quantity = quantity;
          if (items[i].quantity === 0) {
            items.splice(i, 1);
            const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : items} }, {returnDocument: "after"});
            res.status(200).send(updatedCart.value);
            return;
          }
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
  
  app.post('/events', async (req: Request, res: Response) => {
    const { type }: {type: string} = req.body;
    if (type === 'UserCreated') {
      const { data } = req.body;
      const { _id, name, address, email, doNotDisturb } = data;
      req.body.userId = _id;  
      await createCartDB(mongo, req, res);
      if (_id == undefined || name == undefined || address == undefined || email == undefined || doNotDisturb == undefined) {
        res.status(400).json({ message: 'Event data incomplete' })
        return;
      }
      try {
        const db = mongo.db()
        const newUser: User = {
          _id,
          name,
          address,
          email,
          doNotDisturb
        }
        const users = db.collection("users")
        await users.insertOne(newUser)
        res.status(200).send({message: "Successfully handled UserCreated event inside Cart service"});
        return;
      } catch (error) {
        res.status(500).json(error)
        return;
      }
    }

    // TODO: create a restaurant based on the event...
    if (type === 'RestaurantCreated') {  
      const { data } = req.body;
      const { _id, name, address, type, foods } = data;
      if (_id == undefined || name == undefined || address == undefined || type == undefined || foods == undefined) {
        res.status(400).json({ message: 'Event data incomplete' })
        return;
      }
      try {
        const db = mongo.db()
        const newRestaurant: Restaurant = {
          _id,
          name,
          address,
          type,
          foods
        }
        const restaurants = db.collection("restaurants")
        await restaurants.insertOne(newRestaurant)
        res.status(200).send({message: "Successfully handled RestaurantCreated event inside Cart service"});
        return;
      } catch (error) {
        res.status(500).json(error)
        return;
      }
    }

    if (type === 'OrderProcessed') {
      const { data } = req.body;
      const { userId, foods } = data;
      req.params.userId = userId;
      try {
        const db = mongo.db()
        const carts: Collection<Document> = db.collection('carts');
        const cart: WithId<Document> | undefined = await getCartDB(mongo, req, res);
        if (cart === undefined) {
          res.status(400).send({message: "Cart not found, given a userId"});
          return;
        }
        const cartId = cart._id;
        const updatedCart = await carts.findOneAndUpdate({"_id" : new ObjectId(cartId)}, { $set: { "items" : []} }, {returnDocument: "after"});
        res.status(200).send({message : "Successfully handled OrderProcessed event inside Cart Service"})
        return;
      } catch(err) {
        res.status(500).send({message: 'Error occurred while updating cart triggered from -> DeliveryCreated event'})
        return;
      }
    }
      res.status(200).send({});
      return;
  });

  const eventSubscriptions = ["UserCreated", "OrderProcessed", "RestaurantCreated"];
  const eventURL = "http://cart:4003/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();