import express, { Request, Response, NextFunction } from 'express';
import { UserNotification, DriverNotification, TYPE_TO_MESSAGE_MAP, Driver, User, Restaurant } from './types/dataTypes';
import { Collection, Db, Document, FindCursor, MongoClient, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import logger from 'morgan';
import axios from 'axios';
import cors from 'cors';
import jwt, { JwtPayload } from "jsonwebtoken";

// NOTIFICATIONS SERVICE

const app = express();

app.use(express.json());
app.use(logger('dev'));
app.use(cors());

const port = 4006;

console.log(process.env.DATABASE_URL);

const MESSAGE_MAP: TYPE_TO_MESSAGE_MAP = {
  payment_failure: `You have insufficient funds, please add more to your wallet to make a purchase`,
  payment_success: `Your payment has been received and funds have been deducted from your account`,
  delivery_success: `Your food has arrived at your residential area! Enjoy!`,
  pickup_success: `You have successfully picked up your food! Enjoy!`,
  wallet_success: `Your account balance has been updated!`,
  delivery_assigned_success: `A delivery has been assigned to you!`,
  order_ready: `Your food is ready to be picked up!`
};

async function connectDB(): Promise<MongoClient> {
  const uri: string | undefined = process.env.DATABASE_URL;

  if (uri === undefined) {
    throw Error('DATABASE_URL environment variable is not specified');
  }

  const mongo: MongoClient = new MongoClient(uri);
  await mongo.connect();
  return await Promise.resolve(mongo);
}


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

async function hasDoNotDisturb(mongo: MongoClient, type: string, id: string): Promise<boolean> {
  try {
    const db: Db = mongo.db();
    const typeQuery = type === 'driver' ? 'drivers' : 'users';
    const collection: Collection<Document> = db.collection(typeQuery);
    
    const res = await collection.findOne({_id: new ObjectId(id)});

    if (!res) {
      return false;
    }

    return res.doNotDisturb;
  } catch (err: any) {
    return false;
  }
}

async function start() {
  const mongo = await connectDB();

  // TODO: authorize it
  app.get('/api/notification/user/get', verifyUserToken, async (req: Request, res: Response) => {
    const { userId }: { userId: string } = req.body;
    if (userId == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const notifications: Collection<Document> = db.collection('user-notifications');
      const cursor: FindCursor<WithId<Document>> = await notifications.find({"userId" : new ObjectId(userId)})
      const userNotifications: WithId<Document>[] = [];
      await cursor.forEach(doc => {
        userNotifications.push(doc);
      });
      return res.status(200).json(userNotifications);
    } catch (err: any) {
      res.status(500).json({error: err.message});
    }
  });

  // TODO: authorize it
  app.get('/api/notification/driver/get', verifyDriverToken, async (req: Request, res: Response) => {
    const { driverId }: { driverId: string } = req.body;
    if (driverId== null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const notifications: Collection<Document> = db.collection('driver-notifications');
      const cursor: FindCursor<WithId<Document>> = await notifications.find({"driverId" : new ObjectId(driverId)})
      const driverNotifications: WithId<Document>[] = [];
      await cursor.forEach(doc => {
        driverNotifications.push(doc);
      });
      return res.status(200).json(driverNotifications);
    } catch (err: any) {
      res.status(500).json({error: err.message});
    }
  });

  app.post('/api/notification/user/create', async (req: Request, res: Response) => {
    const { userId, notificationMessage }: {userId: string, notificationMessage: string} = req.body;
    if (userId == null || notificationMessage == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const notifications: Collection<Document> = db.collection('user-notifications');
      const _id: ObjectId = new ObjectId();

      const notification: UserNotification = {
        _id,
        userId: new ObjectId(userId),
        notificationMessage,
        isRead: false
      }

      await notifications.insertOne(notification);
    
      res.status(201).json(notification);
      return;
    } catch (err: any) {
      res.status(500).json({error: err.message});
    }
  });

  app.post('/api/notification/driver/create', async (req: Request, res: Response) => {
    const { driverId, notificationMessage }: {driverId: string, notificationMessage: string} = req.body;
    if (driverId == null || notificationMessage == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const notifications: Collection<Document> = db.collection('driver-notifications');
      const _id: ObjectId = new ObjectId();

      const notification: DriverNotification = {
        _id,
        driverId: new ObjectId(driverId),
        notificationMessage,
        isRead: false
      }

      await notifications.insertOne(notification);
    
      res.status(201).json(notification);
      return;
    } catch (err: any) {
      res.status(500).json({error: err.message});
    }
  });

  app.put('/api/notification/user/update/:notificationId', async (req: Request, res: Response) => {
    const notificationId: string = req.params['notificationId'];
    const { isRead }: {isRead: boolean} = req.body;
    if (notificationId == null || isRead == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(notificationId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db: Db = mongo.db();
    const notifications: Collection<Document> = db.collection('user-notifications');
    try {
      const notificationDB: WithId<Document> | null = await notifications.findOne({"_id" : new ObjectId(notificationId)});
      if (!notificationDB) {
        res.status(400).json({message: "Notification not found"});
        return;
      }
      const updatedNotification = await notifications.findOneAndUpdate({"_id" : new ObjectId(notificationId)}, { $set: { "isRead" : isRead} }, {returnDocument: "after"});
      res.status(200).json(updatedNotification.value);
      return;
    } catch (err: any) {
      res.status(500).json({error: err.message});
      return;
    }
  });

  app.put('/api/notification/driver/update/:notificationId', async (req: Request, res: Response) => {
    const notificationId: string = req.params['notificationId'];
    const { isRead }: {isRead: boolean} = req.body;
    if (notificationId == null || isRead == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(notificationId)) {
      res.status(400).json({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db: Db = mongo.db();
    const notifications: Collection<Document> = db.collection('driver-notifications');
    try {
      const notificationDB: WithId<Document> | null = await notifications.findOne({"_id" : new ObjectId(notificationId)});
      if (!notificationDB) {
        res.status(400).json({message: "Notification not found"});
        return;
      }
      const updatedNotification = await notifications.findOneAndUpdate({"_id" : new ObjectId(notificationId)}, { $set: { "isRead" : isRead} }, {returnDocument: "after"});
      res.status(200).json(updatedNotification.value);
      return;
    } catch (err: any) {
      res.status(500).json({error: err.message});
      return;
    }
  });

  app.post('/events', async (req: Request, res: Response) => {
    const { type }: {type: string} = req.body;
    if (type === 'UserCreated') {
      try {
        const { data } = req.body;
        const { _id, name, address, email, doNotDisturb }:
        {_id: string, name: string, address: string, email: string, doNotDisturb: boolean} = data;
        const db: Db = mongo.db();
        const users: Collection<Document> = db.collection('users');
        const user: User = {
          _id: new ObjectId(_id),
          name,
          address,
          email,
          doNotDisturb
        }
        await users.insertOne(user);
        res.status(200).json({message: "Successfully handled UserCreated event in Notification Service"});
        return;
      } catch (err: any) {
        res.status(500).json({error: err.message});
        return;
      }
    }

    if (type === 'DriverCreated') {
      try {
        const { data } = req.body;
        const { _id, name, email, doNotDisturb }:
        {_id: string, name: string, email: string, doNotDisturb: boolean} = data;
        const db: Db = mongo.db();
        const drivers: Collection<Document> = db.collection('drivers');
        const driver: Driver = {
          _id: new ObjectId(_id),
          name,
          email,
          doNotDisturb
        }
        await drivers.insertOne(driver);
        res.status(200).json({message: "Successfully handled DriverCreated event in Notification Service"});
        return;
      } catch (err: any) {
        res.status(500).json({error: err.message});
        return;
      }
    }

    // json a notification to the user that their order was placed,
    // this could either be a pickup or delivery
    if (type === 'OrderCreated') {
      const { data } = req.body;
      const { userId }: { userId: string} = data;
      const orderType: string = data.type;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const notificationMessage: string = `Your ${orderType} order has been placed!`
        // TODO: authenticate the endpoint and do this differently
        await axios.post(`http://notifications:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        }); 
        res.status(200).json({message: "Successfully handled OrderCreated event in Notification Service"});
        return;
      }
    }

    // 1. send a notification to the user that their order 
    // was either: a. Insufficient Funds or b. Payment was received

    // 2. send a notification to the user that their food has
    // has either: a. Arrived or b. Been picked up
    if (type === 'OrderProcessed') {
      const { data } = req.body;
      const { userId }: {userId: string } = data;
      const orderType: string = data.type;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const status: string = data.status;
        const notificationMessage: string = status === "rejected" ? MESSAGE_MAP.payment_failure : MESSAGE_MAP.payment_success;
        await axios.post(`http://notifications:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        });
      }
      res.status(200).json({message: "Successfully handled OrderProcessed event in Notification Service"});
      return;
    }

    if (type === 'OrderCompleted') {
      const { data } = req.body;
      const { userId }: {userId: string } = data;
      const orderType: string = data.type;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const notificationMessage: string = orderType === "delivery" ? MESSAGE_MAP.delivery_success :  MESSAGE_MAP.pickup_success;
        await axios.post(`http://notifications:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        });
      }
      res.status(200).json({message: "Successfully handled OrderCompleted event in Notification Service"});
      return;
    }

    // send a notification to the user that their balance has been updated
    if (type === 'MoneyAdded') {
      const { data } = req.body;
      const { userId, balance }: {userId: string, balance: number} = data;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const notificationMessage: string = MESSAGE_MAP.wallet_success + ` Your current balance is: ${balance}`;
        await axios.post(`http://notifications:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        }); 
      }
      res.status(200).json({message: "Successfully handled MoneyAdded event in Notification Service"});
      return;
    }

    // send a notification to the driver that they 
    // have been assigned a delivery 
    if (type === 'DriverAssigned') {
      const { data } = req.body;
      const { driverId }: {driverId: string} = data;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'driver', driverId);
      if (!doNotDisturb) {
        const notificationMessage: string = MESSAGE_MAP.delivery_assigned_success;
        await axios.post(`http://notifications:4006/api/notification/driver/create`, {
          driverId,
          notificationMessage
        }); 
      }
      res.status(200).json({message: "Successfully handled DriverAssigned event in Notification Service"});
      return;
    }

    // send a notification to the user that their order is ready for pickup
    if (type === 'OrderReady') {
      const { data } = req.body;
      const { userId }: {userId: string } = data;
      const orderType: string = data.type;
      const doNotDisturbUser: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (orderType === 'pickup' && !doNotDisturbUser) { // pickup
        const notificationMessage: string = MESSAGE_MAP.order_ready;
        await axios.post(`http://notifications:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        });
      }
      res.status(200).json({message: "Successfully handled OrderReady event in Notification Service"});
      return;
    }

    res.json({ message: 'ok' });
    return;
  });

  const eventSubscriptions = ["UserCreated", "DriverCreated", "MoneyAdded", "DriverAssigned", "OrderProcessed", "OrderReady", "OrderCreated", "OrderCompleted"];
  const eventURL = "http://notifications:4006/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })

  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();