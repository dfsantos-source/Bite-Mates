import express, { Request, Response } from 'express';
import { UserNotification, DriverNotification, TYPE_TO_MESSAGE_MAP, Driver, User } from './types/dataTypes';
import { Collection, Db, Document, MongoClient, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import logger from 'morgan';
import axios from 'axios';
import cors from 'cors';

// NOTIFICATIONS SERVICE

const app = express();

app.use(express.json());
app.use(logger('dev'));
app.use(cors());

const port = 4006;

console.log(process.env.DATABASE_URL);

const MESSAGE_MAP: TYPE_TO_MESSAGE_MAP = {
  payment_failure: `You have insufficient funds, please add more to your wallet to make a purchase`,
  payment_success: `Your payment has been received, thank you for ordering from BeFake!`,
  delivery_success: `Your food has arrived at your residential area! Enjoy!`,
  pickup_success: `You have successfully picked up your food! Enjoy!`,
  wallet_success: `You have successfully added money to your account!`,
  delivery_assigned_success: `A delivery has been assigned to you!`
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

async function hasDoNotDisturb(mongo: MongoClient, type: string, id: string): Promise<boolean> {
  try {
    const db: Db = mongo.db();
    const typeQuery = type === 'driver' ? 'drivers' : 'users';
    const collection: Collection<Document> = db.collection(typeQuery);
    
    const res = await collection.findOne({_id: new ObjectId(id)});

    if (!res) {
      return false;
    }

    return res.value.doNotDisturb;
  } catch (err: any) {
    return false;
  }
}

async function start() {
  const mongo = await connectDB();

  app.post('/api/notification/user/create', async (req: Request, res: Response) => {
    const { userId, notificationMessage }: {userId: string, notificationMessage: string} = req.body;
    if (userId == null || notificationMessage == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(userId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
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
    
      res.status(201).send(notification);
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  app.post('/api/notification/driver/create', async (req: Request, res: Response) => {
    const { driverId, notificationMessage }: {driverId: string, notificationMessage: string} = req.body;
    if (driverId == null || notificationMessage == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
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
    
      res.status(201).send(notification);
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  app.put('/api/notification/user/update/:notificationId', async (req: Request, res: Response) => {
    const notificationId: string = req.params['notificationId'];
    const { isRead }: {isRead: boolean} = req.body;
    if (notificationId == null || isRead == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(notificationId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db: Db = mongo.db();
    const notifications: Collection<Document> = db.collection('user-notifications');
    try {
      const notificationDB: WithId<Document> | null = await notifications.findOne({"_id" : new ObjectId(notificationId)});
      if (!notificationDB) {
        res.status(400).send({message: "Notification not found"});
        return;
      }
      const updatedNotification = await notifications.findOneAndUpdate({"_id" : new ObjectId(notificationId)}, { $set: { "isRead" : isRead} }, {returnDocument: "after"});
      res.status(200).send(updatedNotification.value);
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.put('/api/notification/driver/update/:notificationId', async (req: Request, res: Response) => {
    const notificationId: string = req.params['notificationId'];
    const { isRead }: {isRead: boolean} = req.body;
    if (notificationId == null || isRead == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(notificationId)) {
      res.status(400).send({message: "Id is not a valid mongo ObjectId"});
      return;
    }
    const db: Db = mongo.db();
    const notifications: Collection<Document> = db.collection('driver-notifications');
    try {
      const notificationDB: WithId<Document> | null = await notifications.findOne({"_id" : new ObjectId(notificationId)});
      if (!notificationDB) {
        res.status(400).send({message: "Notification not found"});
        return;
      }
      const updatedNotification = await notifications.findOneAndUpdate({"_id" : new ObjectId(notificationId)}, { $set: { "isRead" : isRead} }, {returnDocument: "after"});
      res.status(200).send(updatedNotification.value);
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.post('/events', async (req: Request, res: Response) => {
    const { type }: {type: string} = req.body;
    if (type === 'UserCreated') {
      try {
        const { data } = req.body;
        const { userId, name, address, email, doNotDisturb }:
        {userId: string, name: string, address: string, email: string, doNotDisturb: boolean} = data;
        const db: Db = mongo.db();
        const users: Collection<Document> = db.collection('users');
        const user: User = {
          _id: new ObjectId(userId),
          name,
          address,
          email,
          doNotDisturb
        }
        await users.insertOne(user);
      } catch (err: any) {
        res.status(500).send({error: err.message});
        return;
      }
    }

    if (type === 'DriverCreated') {
      try {
        const { data } = req.body;
        const { driverId, name, email, doNotDisturb }:
        {driverId: string, name: string, email: string, doNotDisturb: boolean} = data;
        const db: Db = mongo.db();
        const drivers: Collection<Document> = db.collection('drivers');
        const driver: Driver = {
          _id: new ObjectId(driverId),
          name,
          email,
          doNotDisturb
        }
        await drivers.insertOne(driver);
      } catch (err: any) {
        res.status(500).send({error: err.message});
        return;
      }
    }

    // send a notification to the user that their order was placed,
    // this could either be a pickup or delivery
    if (type === 'OrderCreated') {
      const { data } = req.body;
      const { userId }: { userId: string} = data;
      const orderType: string = data.type;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const notificationMessage: string = `Your ${orderType} order has been placed!`
        await axios.post(`http://drivers:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        }); 
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
        await axios.post(`http://drivers:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        });
        if (status === "ordered") { 
          const notificationMessage: string = orderType === "delivery" ? MESSAGE_MAP.delivery_success :  MESSAGE_MAP.pickup_success;
          await axios.post(`http://drivers:4006/api/notification/user/create`, {
            userId,
            notificationMessage
          });
        } 
      }
    }

    // send a notification to the user that money was added to their account
    if (type === 'MoneyAdded') {
      const { data } = req.body;
      const { userId, amount }: {userId: string, amount: number} = data;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'user', userId);
      if (!doNotDisturb) {
        const notificationMessage: string = MESSAGE_MAP.wallet_success + `The amount added was: ${amount}`;
        await axios.post(`http://drivers:4006/api/notification/user/create`, {
          userId,
          notificationMessage
        }); 
      }
    }

    // send a notification to the driver that they 
    // have been assigned a delivery 
    if (type === 'DeliveryAssigned') {
      const { data } = req.body;
      const { driverId }: {driverId: string} = data;
      const doNotDisturb: boolean = await hasDoNotDisturb(mongo, 'driver', driverId);
      if (!doNotDisturb) {
        const notificationMessage: string = MESSAGE_MAP.delivery_assigned_success;
        await axios.post(`http://drivers:4006/api/notification/user/create`, {
          driverId,
          notificationMessage
        }); 
      }
    }

    res.send({ message: 'ok' });
    return;
  });

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();