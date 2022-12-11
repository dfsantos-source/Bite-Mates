import { ObjectId } from 'mongodb';
import express, { Request, Response, NextFunction } from 'express';
import { MongoClient } from 'mongodb';
import { initRestaurants } from './initData';
import cors from "cors";
import logger from "morgan";
import axios from "axios"
import jwt, { JwtPayload } from "jsonwebtoken";
import { RestaurantComment, DriverComment, RestaurantCommentData, DriverCommentData, User, Restaurant, RestaurantReview, DriverReview, Driver } from './types/dataTypes';

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger("dev"));
const port = 4009;

function verifyUserToken(req: Request, res: Response, next: NextFunction) {
  const authHeader: string | undefined = req.headers.authorization;
  const token: string | undefined = authHeader?.split(" ")[1];
  if (token === undefined) {
    res.status(400).json({ message: "Token is missing from header" });
    return
  }
  try {
    if (process.env.ACCESS_TOKEN === undefined) {
      res.status(500).json({ message: "access _token string missing" });
      return;
    }
    const parsedToken: string | JwtPayload = jwt.verify(token, process.env.ACCESS_TOKEN) as { _id: string, iat: number };
    req.body.userId = parsedToken._id; // dynamic here
    next();
  }
  catch (err) {
    res.status(500).json({ message: "Error verifying token" })
    return
  }
}

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
}

async function start() {
  const mongo = await connectDB();
  await initDB(mongo);

  app.post("/api/review-comment/restaurant/create", async (req: Request, res: Response) => {
    const db = mongo.db()
    const { restaurantId, reviewId, content, userId } = req.body;

    if (restaurantId === undefined || reviewId === undefined || content === undefined || userId === undefined) {
      res.status(400).json({ message: "incomplete Body" })
    }
    else {
      const reviewComment: RestaurantComment = {
        _id: new ObjectId,
        restaurantId: new ObjectId(restaurantId),
        userId: new ObjectId(userId),
        reviewId: new ObjectId(reviewId),
        content: content
      }

      try {
        const restaurantComment = db.collection("restaurant-review-comments");

        const result = await restaurantComment.insertOne(reviewComment);

        res.status(201).json(reviewComment)
      }
      catch (err) {
        console.log(err)
        res.status(404).json({ error: err })
      }

    }
  })


  app.post("/api/review-comment/driver/create", verifyUserToken, async (req: Request, res: Response) => {
    const db = mongo.db()
    const { driverId, reviewId, content, userId } = req.body;

    if (driverId === undefined || reviewId === undefined || content === undefined || userId === undefined) {
      res.status(500).json({ message: "incomplete Body" })
    }
    else {
      const reviewComment: DriverComment = {
        _id: new ObjectId,
        driverId: new ObjectId(driverId),
        userId: new ObjectId(userId),
        reviewId: new ObjectId(reviewId),
        content: content
      }

      try {
        const restaurantComment = db.collection("driver-review-comments");

        const result = await restaurantComment.insertOne(reviewComment);

        res.status(201).json(reviewComment)
      }
      catch (err) {
        console.log(err)
        res.status(500).json({ error: err })
      }
    }
  })

  app.get("/api/review-comment/restaurant/get/:reviewId", verifyUserToken, async (req: Request, res: Response) => {
    const db = mongo.db()
    const reviewId = req.params.reviewId

    if (reviewId === undefined) {
      res.status(400).json({ message: "request is invalid: no reviewId in URL" })
    }
    else {
      try {
        const restaurantComments = db.collection("restaurant-review-comments");

        const result = restaurantComments.find({ reviewId: new ObjectId(reviewId) })

        const reviewComments: RestaurantCommentData[] = [];

        await result.forEach((doc) => {
          const comment: RestaurantCommentData = {
            _id: doc._id.toHexString(),
            content: doc.content,
            restaurantId: doc.restaurantId,
            userId: doc.userId,
            reviewId: doc.reviewId
          }
          reviewComments.push(comment);
        })

        res.status(200).json(reviewComments);
      }
      catch (err) {
        res.status(500).json({ message: err })
      }


    }

  })

  app.get("/api/review-comment/driver/get/:reviewId", async (req: Request, res: Response) => {
    const db = mongo.db()
    const reviewId = req.params.reviewId

    if (reviewId === undefined) {
      res.status(400).json({ message: "request is invalid: no reviewId in URL" })
    }
    else {
      try {
        const driverComments = db.collection("driver-review-comments");

        const result = driverComments.find({ reviewId: new ObjectId(reviewId) })

        const reviewComments: DriverCommentData[] = [];

        await result.forEach((doc) => {
          const comment: DriverCommentData = {
            _id: doc._id.toHexString(),
            content: doc.content,
            driverId: doc.driverId,
            userId: doc.userId,
            reviewId: doc.reviewId
          }
          reviewComments.push(comment);
        })

        res.status(200).json(reviewComments);
      }
      catch (err) {
        res.status(500).json({ message: err })
      }
    }

  })


  app.post("/events", async (req: Request, res: Response) => {
    const event = req.body;

    if (event.type === "UserCreated") {
      const { _id, name, address, email, do_not_disturb } = event.data;

      if (_id === undefined || name === undefined || address === undefined || email === undefined) {
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
            do_not_disturb
          }

          const users = db.collection("users")

          const result = await users.insertOne(newUser)

          res.status(200).json(newUser)

        } catch (error) {
          res.status(500).json(error)
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

          const restaurants = db.collection("restaurants")

          const result = await restaurants.insertOne(newRestaurant)

          res.status(200).json(newRestaurant)

        } catch (error) {
          res.status(500).json(error)
        }
      }
    }

    if (event.type === "DriverCreated") {
      const { _id, name, email, doNotDisturb } = event.data;

      if (_id === undefined || name === undefined || email === undefined || doNotDisturb === undefined) {
        res.status(400).json({ message: 'event body incomplete' })
      }
      else {
        try {
          const db = mongo.db()

          const newDriver: Driver = {
            _id,
            name,
            email,
            doNotDisturb,
          }

          const drivers = db.collection("drivvers")

          const result = await drivers.insertOne(newDriver)

          res.status(200).json(newDriver)

        } catch (error) {
          res.status(500).json(error)
        }
      }
    }



    if (event.type === "RestaurantReviewCreated") {
      const { _id, userId, restaurantId, content, rating } = event.data;

      if (_id === undefined || userId === undefined || restaurantId === undefined || content === undefined || rating === undefined) {
        res.status(400).json({ message: "incomplete body" });
      }
      else {
        try {
          const db = mongo.db();

          const restaurantReviewDb = db.collection("restaurantReviews");

          const newRestaurantReview: RestaurantReview = {
            _id,
            userId,
            restaurantId,
            content,
            rating
          }

          await restaurantReviewDb.insertOne(newRestaurantReview)

          res.status(201).json(newRestaurantReview);

        } catch (error) {
          res.status(500).json(error)
        }
      }

    }

    if (event.type === "DriverReviewCreated") {
      const { _id, userId, driverId, content, rating } = event.data;

      if (_id === undefined || userId === undefined || driverId === undefined || content === undefined || rating === undefined) {
        res.status(400).json({ message: "incomplete body" });
      }
      else {
        try {
          const db = mongo.db();

          const driverReviewDb = db.collection("driverReviews");

          const newDriverReview: DriverReview = {
            _id,
            userId,
            driverId,
            content,
            rating
          }

          await driverReviewDb.insertOne(newDriverReview)

          res.status(201).json(newDriverReview);

        } catch (error) {
          res.status(500).json(error)
        }
      }

    }

  })


  const eventSubscriptions = ["UserCreated", "RestaurantCreated", "DriverCreated", "RestaurantReviewCreated", "DriverReviewCreated"];
  const eventURL = "http://review-comments:4009/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })


  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()