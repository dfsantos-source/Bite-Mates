import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants, initRestaurantOrders } from './initData';
import cors from "cors";
import logger from "morgan";
import { RestaurantMetrics, UserMetrics, DriverMetrics, Restaurant, User } from './types/dataTypes';
import axios from 'axios';


const app = express();
app.use(cors());
app.use(express.json());
app.use(logger("dev"))
const port = 4005;

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
  }
  else {
    const products = db.collection('restaurants');
    const result = await products.insertMany(initRestaurants);

    console.log(`Initialized ${result.insertedCount} products`);
    console.log(`Initialized:`);

    for (let key in result.insertedIds) {
      console.log(`  Inserted product with ID ${result.insertedIds[key]}`);
    }
  }

  if (await db.listCollections({ name: 'restaurantOrders' }).hasNext()) {
    console.log("Collection already exists. Skipping initialization.")
  }
  else {
    const restaurantOrders = db.collection("restaurantOrders");

    const res = await restaurantOrders.insertMany(initRestaurantOrders)

    for (let key in res.insertedIds) {
      console.log(`Inserted restaurant_orders with ID ${res.insertedIds[key]}`);
    }

  }
}

async function start() {
  const mongo = await connectDB();
  await initDB(mongo)

  app.get("/api/metrics/popular/restaurants", async (req: Request, res: Response) => {
    const db = mongo.db();

    const restaurantOrders = db.collection("restaurantOrders");

    const result = restaurantOrders.find()

    const restaurantIds: ObjectId[] = []



    await result.forEach((doc) => {
      restaurantIds.push(doc.restaurantId);
    })

    const restaurantsDb = db.collection("restaurants");

    const restaurantDocs = restaurantsDb.find({ _id: { $in: restaurantIds } })

    const popularRestaurants: Restaurant[] = [];

    await restaurantDocs.forEach((doc) => {
      const restaurant = {
        _id: doc._id,
        name: doc.name,
        address: doc.address,
        type: doc.type,
        foods: doc.foods
      }
      popularRestaurants.push(restaurant)
    })

    res.status(200).json(popularRestaurants);

  })


  app.post("/events", async (req: Request, res: Response) => {
    const event = req.body;
    if (event.type === "OrderProcessed") {
      const data = event.data

      const userId = data.userId;
      const restaurantId = data.restaurantId;
    }

    if (event.type === "UserCreated") {
      const { _id, name, address, email, doNotDisturb } = event.data;

      if (_id == undefined || name == undefined || address == undefined || email == undefined) {
        res.status(400).json({ message: 'event body incomplete' })
      }
      else {
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

          const result = await users.insertOne(newUser)

          res.status(200).json(newUser)
          return;

        } catch (error) {
          res.status(500).json(error)
          return;
        }
      }
    }

    if (event.type === "RestaurantCreated") {
      const { _id, name, address, type, foods } = event.data;

      if (_id === undefined || name === undefined || address === undefined || type === undefined || foods === undefined) {
        res.status(400).json({ message: 'event body incomplete' })
      }
      else {
        try {
          const db = mongo.db()

          const newRestaurant: Restaurant = {
            _id,
            name,
            address,
            type,
            foods
          }

          const users = db.collection("restaurants")

          const result = await users.insertOne(newRestaurant)

          res.status(200).json(newRestaurant)

        } catch (error) {
          res.status(500).json(error)
        }
      }

    }

    if (event.type === "DriverCreated") {

    }

    if (event.type === "RestaurantReviewCreated") {

    }

    if (event.type === "DriverReviewCreated") {

    }



  })


  const eventSubscriptions = ["UserCreated"];
  const eventURL = "http://metrics:4005/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })




  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()