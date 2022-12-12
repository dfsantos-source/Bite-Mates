import express, { Request, Response, NextFunction } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { initRestaurants } from './initData';
import axios from 'axios';
import cors from 'cors';
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from 'morgan';


const app = express();
app.use(express.json());
app.use(cors());
app.use(logger('dev'));
const port = 4001;


function verifyDriverToken(req: Request, res: Response, next: NextFunction) {
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
    req.body.driverId = parsedToken._id; // dynamic here
    next();
  }
  catch (err) {
    res.status(500).json({message: "Error verifying token"})
    return
  }
}

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
    const delivery = event.data;
    if(event.type === "OrderProcessed" && delivery.type === "delivery"){
      if(delivery.status === "ordered"){
        delivery.userId = new ObjectId(delivery.userId);
        const db = mongo.db();
        const deliveries = db.collection("deliveries");
        await deliveries.insertOne(delivery);
        res.status(201).json({delivery: delivery, message: "Delivery successfully Added"});
        return;
      }
      else{
        res.status(404).send({ message: 'Insufficient Funds.' });
        return;
      }
    }
    if(event.type === "OrderReady" && delivery.type === "delivery"){
      const db = mongo.db();
      if(delivery._id !== null){
        const deliveries = db.collection("deliveries");
        const updatedDeliveryDoc = await deliveries.findOneAndUpdate({_id: new ObjectId(delivery._id)}, {$set: {status: "ready for pickup"}}, {returnDocument : "after"});
        if(updatedDeliveryDoc === null){
          res.status(404).send({ message: 'Delivery not found.' });
          return;
        }
        else{
          res.status(200).json({delivery: updatedDeliveryDoc.value, message: 'Order ready for pickup.' });
          return;
        }
      }
      else{
        res.status(400).send({ message: 'Body not complete.' });
        return;
      }
    }
    res.status(200).json({});
    return;
  });

  app.post('/api/delivery/create', verifyUserToken, (req: Request, res: Response) => {
    const body = req.body;
    if(body.userId !== null && body.time !== null && body.foods !== null && body.totalPrice !== null){
      const delivery = {
        type : "OrderCreated",
        data : {...body, type: "delivery"}
      }
      axios.post('http://eventbus:4000/events', delivery).catch((err) => {
        console.log(err.message);
      });
      res.status(201).json({delivery: delivery, message: "Delivery successfully Created"});
      return;
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
      return;
    }
  });

  app.put('/api/delivery/driver/assign', verifyDriverToken, async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body._id !== null && body.driverId !== null){
      const deliveries = db.collection("deliveries");
      const updatedDeliveryDoc = await deliveries.findOneAndUpdate({_id: new ObjectId(body._id)}, {$set: {driverId: new ObjectId(body.driverId), status: "in transit"}}, {returnDocument : "after"});
      if(updatedDeliveryDoc === null){
        res.status(404).send({ message: 'Delivery not found.' });
        return;
      }
      else{
        const updatedDelivery = {
          type : "DriverAssigned",
          data : {...updatedDeliveryDoc.value}
        }
        axios.post('http://eventbus:4000/events', updatedDelivery).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({delivery: updatedDelivery, message: 'Driver successfully assigned.' });
        return;
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
      return;
    }
  });

  app.put('/api/delivery/complete', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    if(body._id !== null){
      const deliveries = db.collection("deliveries");
      const updatedDeliveryDoc = await deliveries.findOneAndUpdate({_id: new ObjectId(body._id)}, {$set: {status: "delivered"}}, {returnDocument : "after"});
      if(updatedDeliveryDoc === null){
        res.status(404).send({ message: 'Delivery not found.' });
        return;
      }
      else{
        const updatedDelivery = {
          type : "OrderCompleted",
          data : {...updatedDeliveryDoc.value}
        }
        axios.post('http://eventbus:4000/events', updatedDelivery).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({delivery: updatedDelivery, message: 'Delivery has been completed.' });
        return;
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
      return;
    }
  });

  app.get('/api/delivery/get/all/unassigned', async (req: Request, res: Response) => {
    const db = mongo.db();
    const deliveries = db.collection("deliveries");
    const unassignedDeliveriesDoc = deliveries.find();
    const unassignedDeliveries: any = []; 
    await unassignedDeliveriesDoc.forEach(doc => {
      if(doc.driverId === null){
        unassignedDeliveries.push(doc);
      }
    });
    if(unassignedDeliveries.length !== 0){
      res.status(200).json({deliveries: unassignedDeliveries, message: 'Unassigned deliveries found.' });
      return;
    } 
    else{
      res.status(404).send({ message: 'No unassigned deliveries found' });
      return;
    }
  });

  app.get('/api/delivery/get/all/user', verifyUserToken, async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    console.log(req.body)
    const deliveries = db.collection("deliveries");
    if(body.userId !== null){
      const userDeliveriesDoc = deliveries.find({userId: new ObjectId(body.userId)});
      const userDeliveries: any = []; 
      await userDeliveriesDoc.forEach(doc => {
          userDeliveries.push(doc);
      });
      if(userDeliveries.length !== 0){
        res.status(200).json({deliveries: userDeliveries, message: 'User deliveries found.' });
        return;
      } 
      else{
        res.status(404).send({ message: 'No user deliveries found' });
        return;
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
      return;
    }
  });

  app.get('/api/delivery/get/all/driver', verifyDriverToken, async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    const deliveries = db.collection("deliveries");
    if(body.driverId !== null){
      const driverDeliveriesDoc = deliveries.find({driverId: new ObjectId(body.driverId)});
      const driverDeliveries: any = []; 
      await driverDeliveriesDoc.forEach(doc => {
          driverDeliveries.push(doc);
      });
      if(driverDeliveries.length !== 0){
        res.status(200).json({deliveries: driverDeliveries, message: 'Driver deliveries found.' });
        return;
      } 
      else{
        res.status(404).send({ message: 'No driver deliveries found' });
        return;
      }
    }
    else{
      res.status(400).send({ message: 'Body not complete.' });
      return;
    }
  });

  const eventSubscriptions = ["OrderProcessed", "OrderReady"];
  const eventURL = "http://deliveries:4001/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()