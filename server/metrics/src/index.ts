import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants, initRestaurantOrders } from './initData';
import cors from "cors";
import logger from "morgan";
import { RestaurantMetrics, UserMetrics, DriverMetrics, Restaurant, User, Driver } from './types/dataTypes';
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

  if (await db.listCollections({ name: 'restaurantMetrics' }).hasNext()) {
    console.log("Collection already exists. Skipping initialization.")
  }
  else {
    const restaurantOrders = db.collection("restaurantMetrics");

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

      const { userId, foods, totalPrice, status } = event.data

      if (userId === undefined || foods === undefined || totalPrice === undefined || status === undefined) {
        res.status(400).json({ message: "missing body" })
      }
      else {
        try {
          if (status === "ordered") {
            const db = mongo.db();
            const userMetricsDb = db.collection("userMetrics");
            const restaurantMetricsDb = db.collection("restaurantMetrics")

            await userMetricsDb.updateOne({ userId: new ObjectId(userId) }, { $inc: { numOrders: 1, totalPrice: totalPrice } });
            await restaurantMetricsDb.updateOne({ restaurantId: new ObjectId(foods[0].restaurantId) }, { $inc: { numOrders: 1, totalRevenue: totalPrice } });
            res.status(200).json({ message: "updated user and restaurant metrics" })
            return;
          }
          else {
            res.status(200).json({ message: "order was rejected" });
          }
        } catch (error) {
          res.status(500).json(error)
          return;
        }
      }

    }

    if (event.type === "OrderCompleted") {
      const { type } = event.data;

      if (type === undefined) {
        res.status(400).json({ message: "body incomplete" })
      }
      else {
        if (type === "delivery") {
          try {
            const { driverId } = event.data
            const db = mongo.db();

            const driverMetricDb = db.collection("driverMetrics")

            await driverMetricDb.updateOne({ driverId: driverId }, { $inc: { numDeliveries: 1 } })

            res.status(200).json({ message: "updated driver metrics" });
            return;
          } catch (error) {
            res.status(500).json({ message: error })
          }
        }
        res.status(200).json({ message: "order was a pickup" });
      }
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
            _id: new ObjectId(_id),
            name,
            address,
            email,
            doNotDisturb
          }

          const newUserMetric: UserMetrics = {
            _id: new ObjectId(),
            userId: new ObjectId(_id),
            numOrders: 0,
            totalPrice: 0
          }



          const users = db.collection("users")
          const userMetricsDb = db.collection("userMetrics")

          const result = await users.insertOne(newUser)
          const metricResult = await userMetricsDb.insertOne(newUserMetric);

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
            _id: new ObjectId(_id),
            name,
            address,
            type,
            foods
          }

          const newRestaurantMetric: RestaurantMetrics = {
            _id: new ObjectId(),
            restaurantId: new ObjectId(_id),
            numOrders: 0,
            totalRevenue: 0,
            numReviews: 0,
            totalRating: 0,
            averageRating: 0
          }

          const restaurantsDb = db.collection("restaurants")

          const restaurantMetricDb = db.collection("restaurantMetrics")

          const result = await restaurantsDb.insertOne(newRestaurant)

          const metricsResult = await restaurantMetricDb.insertOne(newRestaurantMetric)

          res.status(200).json(newRestaurant)

        } catch (error) {
          res.status(500).json(error)
        }
      }

    }

    if (event.type === "DriverCreated") {
      const event = req.body;
      const { _id, name, email, doNotDisturb } = event.data;

      if (_id === undefined || name === undefined || email === undefined) {
        res.status(400).json({ message: "body incomplete" });
        return;
      }
      else {
        try {
          const db = mongo.db();

          const driversDb = db.collection("drivers");
          const driverMetricsDb = db.collection("driverMetrics")

          const newDriver: Driver = {
            _id: new ObjectId(_id),
            name: name,
            email: email,
            doNotDisturb: doNotDisturb
          }

          const newDriverMetric: DriverMetrics = {
            _id: new ObjectId,
            driverId: new ObjectId(_id),
            numDeliveries: 0,
            numReviews: 0,
            totalRating: 0,
            averageRating: 0
          }

          const result = await driversDb.insertOne(newDriver);
          const metricResult = await driverMetricsDb.insertOne(newDriverMetric);

          res.status(201).json(newDriver);
          return;

        } catch (error) {
          res.status(500).json(error)
          return;
        }
      }
    }

    if (event.type === "RestaurantReviewCreated") {
      const event = req.body;
      const { restaurantId, rating } = event.data;

      if (restaurantId === undefined || rating === undefined) {
        res.status(400).json({ message: "body incomplete" });
        return;
      }
      else {
        try {
          const db = mongo.db();

          const restaurantMetricsDb = db.collection("restaurantMetrics");

          const restaurantMetric = await restaurantMetricsDb.findOne({ restaurantId: new ObjectId(restaurantId) }) as RestaurantMetrics

          if (restaurantMetric === null) {
            res.status(404).json({ message: "restaurant not found" })
            return;
          }

          restaurantMetric.numReviews = restaurantMetric.numReviews + 1;
          restaurantMetric.totalRating = restaurantMetric.totalRating + rating;
          restaurantMetric.averageRating = restaurantMetric.totalRating / restaurantMetric.numReviews

          const updateResult = await restaurantMetricsDb.updateOne({ restaurantId: restaurantId }, { $set: { numReviews: restaurantMetric.numReviews, totalRating: restaurantMetric.totalRating, averageRating: restaurantMetric.averageRating } })

          res.status(200).json({ message: "restaurant metrics updated" });
          return;

        } catch (error) {
          res.status(500).json(error)
          return;
        }
      }

    }

    if (event.type === "DriverReviewCreated") {
      const event = req.body;
      const { driverId, rating } = event.data;

      if (driverId === undefined || rating === undefined) {
        res.status(400).json({ message: "body incomplete" });
        return;
      }
      else {
        try {
          const db = mongo.db();

          const driverMetricsDb = db.collection("driverMetrics");

          const driverMetric = await driverMetricsDb.findOne({ restaurantId: new ObjectId(driverId) }) as RestaurantMetrics

          if (driverMetric === null) {
            res.status(404).json({ message: "driver not found" })
            return;
          }

          driverMetric.numReviews = driverMetric.numReviews + 1;
          driverMetric.totalRating = driverMetric.totalRating + rating;
          driverMetric.averageRating = driverMetric.totalRating / driverMetric.numReviews

          const updateResult = await driverMetricsDb.updateOne({ restaurantId: driverId }, { $set: { numReviews: driverMetric.numReviews, totalRating: driverMetric.totalRating, averageRating: driverMetric.averageRating } })

          res.status(200).json({ message: "restaurant metrics updated" });
          return;

        } catch (error) {
          res.status(500).json(error)
          return;
        }
      }

    }



  })


  const eventSubscriptions = ["UserCreated", "RestaurantCreated", "DriverCreated", "RestaurantReviewCreated", "DriverReviewCreated", "OrderCompleted", "OrderProcessed"];
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