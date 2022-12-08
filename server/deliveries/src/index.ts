import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants } from './initData';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
const port = 4001;

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
    const delivery = event.data;
    if(event.type === "OrderProccessed"){
      if(delivery.status === "ordered"){
        const db = mongo.db();
        const deliveries = db.collection("deliveries");
       await deliveries.insertOne(delivery);
        res.status(201).json({delivery: delivery, message: "Delivery successfully Added"});
      }
      else{
        res.status(404).send({ message: 'Insufficient Funds.' });
      }
    }
  });

  app.post('/api/delivery/create', (req: Request, res: Response) => {
    const body = req.body;
    if(body.userId !== null && body.time !== null && body.foods !== null && body.totalPrice !== null){
      const delivery = {
        type : "OrderCreated",
        data : body
      }
      axios.post('http://eventbus:4000/events', delivery).catch((err) => {
        console.log(err.message);
      });
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });

  app.put('/api/delivery/driver/assign', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body.deliveryId !== null && body.driverId !== null){
      const deliveries = db.collection("deliveries");
      const updatedDelivery = await deliveries.findOneAndUpdate({deliveryId: new ObjectId(body.deliveryId)}, {$set: {driverId: new ObjectId(body.driverId), status: "in transit"}}, {returnDocument : "after"});
      if(updatedDelivery === null){
        res.status(404).send({ message: 'Delivery not found.' });
      }
      else{
        axios.post('http://eventbus:4000/events', updatedDelivery).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({delivery: updatedDelivery, message: 'Driver successfully assigned.' });
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
    }
  });

  app.put('/api/delivery/complete', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body.deliveryId !== null){
      const deliveries = db.collection("deliveries");
      const updatedDelivery = await deliveries.findOneAndUpdate({deliveryId: new ObjectId(body.deliveryId)}, {$set: {status: "delivered"}}, {returnDocument : "after"});
      if(updatedDelivery === null){
        res.status(404).send({ message: 'Delivery not found.' });
      }
      else{
        axios.post('http://eventbus:4000/events', updatedDelivery).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({delivery: updatedDelivery, message: 'Delivery has been completed.' });
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