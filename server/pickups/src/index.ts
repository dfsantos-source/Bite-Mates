import express, { Request, Response, NextFunction }  from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants } from './initData';
import axios from 'axios';
import cors from 'cors';
import jwt, { JwtPayload } from "jsonwebtoken";

const app = express();
app.use(express.json());
app.use(cors());
const port = 4007;

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
    res.status(500).json({message: "Error verifying token"})
    return
  }
}

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
    console.log(`  Inserted product with Id ${result.insertedIds[key]}`);
  }
}

async function start() {
  const mongo = await connectDB();
  await initDB(mongo)

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.post('/events', async (req: Request, res: Response) => {
    const event = req.body;
    const pickup = event.data;
    if(event.type === "OrderProccessed" && pickup.type === "pickup"){
      if(pickup.status === "ordered"){
        pickup.userId = new ObjectId(pickup.userId);
        const db = mongo.db();
        const pickups = db.collection("pickups");
       await pickups.insertOne(pickup);
        res.status(201).json({pickup: pickup, message: "Pickup successfully Added"});
      }
      else{
        res.status(404).send({ message: 'Insufficient Funds.' });
      }
    }
    if(event.type === "OrderReady" && pickup.type === "pickup"){
      const db = mongo.db();
      if(pickup._id !== null){
        const pickups = db.collection("pickups");
        const updatedPickupDoc = await pickups.findOneAndUpdate({_id: new ObjectId(pickup._id)}, {$set: {status: "ready for pickup"}}, {returnDocument : "after"});
        if(updatedPickupDoc === null){
          res.status(404).send({ message: 'Pickup not found.' });
        }
        else{
          const updatedPickup = {
            type : "OrderReady",
            data : {...updatedPickupDoc.value}
          }
          axios.post('http://eventbus:4000/events', updatedPickup).catch((err) => {
            console.log(err.message);
          });
          res.status(200).json({pickup: updatedPickup, message: 'Order ready for pickup.' });
        }
      }
      else{
        res.status(400).send({ message: 'Body not complete.' });
      }
    }
  });

  app.post('/api/pickup/create',verifyUserToken, (req: Request, res: Response) => {
    const body = req.body;
    if(body.userId !== null && body.time !== null && body.foods !== null && body.totalPrice !== null){
      const pickup = {
        type : "OrderCreated",
        data : {...body, type: "pickup"}
      }
      axios.post('http://eventbus:4000/events', pickup).catch((err) => {
        console.log(err.message);
      });
      res.status(201).json({pickup: pickup, message: "Pickup successfully Created"});
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });  

  app.put('/api/pickup/complete', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body._id !== null){
      const pickups = db.collection("pickups");
      const updatedPickupDoc = await pickups.findOneAndUpdate({_id: new ObjectId(body._id)}, {$set: {status: "pickedup"}}, {returnDocument : "after"});
      if(updatedPickupDoc === null){
        res.status(404).send({ message: 'Pickup not found.' });
      }
      else{
        const updatedPickup = {
          type : "OrderCompleted",
          data : {...updatedPickupDoc.value}
        }
        axios.post('http://eventbus:4000/events', updatedPickup).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({pickup: updatedPickup, message: 'Pickup has been completed.' });
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });

  const eventSubscriptions = ["OrderProccessed", "OrderReady"];
  const eventURL = "http://pickups:4007/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()