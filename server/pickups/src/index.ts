import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants } from './initData';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
const port = 4007;

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
    if(event.type === "OrderProccessed"){
      if(pickup.status === "ordered"){
        const db = mongo.db();
        const pickups = db.collection("pickups");
       await pickups.insertOne(pickup);
        res.status(201).json({pickup: pickup, message: "Pickup successfully Added"});
      }
      else{
        res.status(404).send({ message: 'Insufficient Funds.' });
      }
    }
  });

  app.post('/api/pickup/create', (req: Request, res: Response) => {
    const body = req.body;
    if(body.userId !== null && body.time !== null && body.foods !== null && body.totalPrice !== null){
      const pickup = {
        type : "OrderCreated",
        data : {body}
      }
      axios.post('http://eventbus:4000/events', pickup).catch((err) => {
        console.log(err.message);
      });
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });

  app.put('/api/pickup/ready', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body.pickupId !== null){
      const pickups = db.collection("pickups");
      const updatedPickup = await pickups.findOneAndUpdate({pickupId: new ObjectId(body.pickupId)}, {$set: {status: "ready for pickup"}}, {returnDocument : "after"});
      if(updatedPickup === null){
        res.status(404).send({ message: 'Pickup not found.' });
      }
      else{
        axios.post('http://eventbus:4000/events', updatedPickup).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({pickup: updatedPickup, message: 'Order ready for pickup.' });
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });

  app.put('/api/pickup/complete', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body.pickupId !== null){
      const pickups = db.collection("pickups");
      const updatedPickup = await pickups.findOneAndUpdate({pickupId: new ObjectId(body.pickupId)}, {$set: {status: "pickedup"}}, {returnDocument : "after"});
      if(updatedPickup === null){
        res.status(404).send({ message: 'Pickup not found.' });
      }
      else{
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

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()