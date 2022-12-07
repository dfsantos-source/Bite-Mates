import express, { Request, Response } from 'express';
import { Driver } from './types/dataTypes';
import { Collection, Db, Document, MongoClient, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import logger from 'morgan';
import { DriverCreated } from './types/eventTypes';
import axios from 'axios';
import cors from 'cors';

// DRIVERS SERVICE

const app = express();

app.use(express.json());
app.use(logger('dev'));
app.use(cors());

const port = 4002;

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

async function start() {
  const mongo = await connectDB();

  app.post('/api/drivers/register', async (req: Request, res: Response) => {
    const { name, email, password }: {name: string, email: string, password: string} = req.body;
    if (name == null || email == null || password == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const _id: ObjectId = new ObjectId();
      const driver: Driver = {
        _id,
        name,
        email,
        password,
        doNotDisurb: false
      }
      await drivers.insertOne(driver);
      
      const driverCreated: DriverCreated = {
        type: 'DriverCreated',
        data: {
          driverId: _id,
          name,
          email,
          doNotDisturb: false
        }
      }

      await axios.post('http://eventbus:4000/events', driverCreated);

      res.status(201).send({
        message: "Driver successfully registered",
        _id,
        name,
        email,
        doNotDisturb: false
      });
      return;
    } catch (err: any) {
      res.status(500).send({error: err.message});
    }
  });

  // TODO: add login authentication
  app.post('/api/drivers/login', async (req: Request, res: Response) => {
    const { email, password }: {email: string, password: string} = req.body;
    if (email == null || password == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const driver: WithId<Document> | null = await drivers.findOne({email, password});
      if (!driver) {
        res.status(404).send({message: "Failed to login, no driver found."});
        return;
      }
      res.status(200).send({
        message: 'Login successful',
        _id: driver._id,
        name: driver.name,
        email
      })
      return;
    } catch (err:any) {
      res.status(500).send({error: err.message});
      return;
    } 
  });

  app.get('/api/drivers/get/:driverId', async (req: Request, res: Response) => {
    const driverId: string = req.params['driverId'];
    if (driverId == null) {
      res.status(400).send({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).send({message: "Id is not valid mongo id"});   
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const driver: WithId<Document> | null = await drivers.findOne({"_id" : new ObjectId(driverId)});
      if (!driver) {
        res.status(404).send({message: "No driver found"});
        return;
      }
      const _id: ObjectId = driver._id;
      const name: string = driver.name;
      const email: string = driver.email;
      res.status(200).send({
        _id: new ObjectId(_id),
        name,
        email
      });
      return;
    } catch(err:any) {
      res.status(500).send({error: err.message});
      return;
    }
  });

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();