import express, { Request, Response, NextFunction } from 'express';
import { Driver } from './types/dataTypes';
import { Collection, Db, Document, ModifyResult, MongoClient, WithId } from 'mongodb';
import { ObjectId } from 'mongodb';
import logger from 'morgan';
import { DriverCreated } from './types/eventTypes';
import axios from 'axios';
import cors from 'cors';
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";

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
    req.body.driverId = parsedToken._id;
    next();
  }
  catch (err) {
    res.status(500).json({message: "Error verifying token"})
    return
  }
}

async function start() {
  const mongo = await connectDB();

  app.post('/api/drivers/register', async (req: Request, res: Response) => {
    const { name, email, password }: {name: string, email: string, password: string} = req.body;
    if (name == null || email == null || password == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const _id: ObjectId = new ObjectId();
      const hashedPassword = await bcrypt.hash(password, 12);
      const driver: Driver = {
        _id,
        name,
        email,
        password: hashedPassword,
        doNotDisturb: false
      }
      await drivers.insertOne(driver);
      
      const driverCreated: DriverCreated = {
        type: 'DriverCreated',
        data: {
          _id: _id,
          name,
          email,
          doNotDisturb: false
        }
      }

      await axios.post('http://eventbus:4000/events', driverCreated);

      if (process.env.ACCESS_TOKEN === undefined) {
        res.status(500).json({ message: "access token missing" })
        return;
      }

      const token: string = jwt.sign({ _id }, process.env.ACCESS_TOKEN, {});

      res.status(201).json({
        message: "Driver successfully registered",
        _id,
        name,
        email,
        doNotDisturb: false,
        token
      });
      return;
    } catch (err: any) {
      res.status(500).json({error: err.message});
    }
  });

  // TODO: add login authentication
  app.post('/api/drivers/login', async (req: Request, res: Response) => {
    const { email, password }: {email: string, password: string} = req.body;
    if (email == null || password == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const driver: WithId<Document> | null = await drivers.findOne({email});
      if (!driver) {
        res.status(404).json({message: "Failed to login, no driver found with email."});
        return;
      }
      const passValid: boolean = await bcrypt.compare(password, driver.password);
      if (!passValid) {
        res.status(404).json({message: "Failed to login, password incorrect."});
        return;
      }
      if (process.env.ACCESS_TOKEN === undefined) {
        res.status(500).json("access token is missing");
        return
      }
      const token: string = jwt.sign({ _id: driver._id }, process.env.ACCESS_TOKEN, {});
      res.status(200).json({
        message: 'Login successful',
        _id: driver._id,
        name: driver.name,
        email,
        doNotDisturb: driver.doNotDisturb,
        token
      })
      return;
    } catch (err:any) {
      res.status(500).json({error: err.message});
      return;
    } 
  });

  app.get('/api/drivers/get', verifyDriverToken, async (req: Request, res: Response) => {
    const driverId: string = req.body['driverId'];
    if (driverId == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).json({message: "Id is not valid mongo id"});   
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const driver: WithId<Document> | null = await drivers.findOne({"_id" : new ObjectId(driverId)});
      if (!driver) {
        res.status(404).json({message: "No driver found"});
        return;
      }
      const _id: ObjectId = driver._id;
      const name: string = driver.name;
      const email: string = driver.email;
      const doNotDisturb: boolean = driver.doNotDisturb;
      res.status(200).json({
        _id: new ObjectId(_id),
        name,
        email,
        doNotDisturb
      });
      return;
    } catch(err:any) {
      res.status(500).json({error: err.message});
      return;
    }
  });

  app.put('/api/drivers/update/doNotDisturb', verifyDriverToken, async (req: Request, res: Response) => {
    const driverId: string = req.body['driverId'];
    const doNotDisturb: boolean = req.body['doNotDisturb'];
    if (driverId == null || doNotDisturb == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).json({message: "Id is not valid mongo id"});   
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const updatedDriver = await drivers.findOneAndUpdate({"_id" : new ObjectId(driverId)}, { $set: { "doNotDisturb" : doNotDisturb } }, {returnDocument: "after"});
      if (!updatedDriver || !updatedDriver.value) {
        res.status(404).json({message: "No driver found"});
        return;
      }
      const updatedDriverData: WithId<Document> = updatedDriver.value;
      res.status(200).json({
        _id: updatedDriverData._id,
        name: updatedDriverData.name,
        email: updatedDriverData.email,
        doNotDisturb: updatedDriverData.doNotDisturb
      });
      return;
    } catch(err:any) {
      res.status(500).json({error: err.message});
      return;
    }
  });

  app.put('/api/drivers/update/email', verifyDriverToken, async (req: Request, res: Response) => {
    const driverId: string = req.body['driverId'];
    const email: string = req.body['email'];
    if (driverId == null || email == null) {
      res.status(400).json({message: "Body not complete"});
      return;
    }
    if (!ObjectId.isValid(driverId)) {
      res.status(400).json({message: "Id is not valid mongo id"});   
      return;
    }
    try {
      const db: Db = mongo.db();
      const drivers: Collection<Document> = db.collection('drivers');
      const updatedDriver = await drivers.findOneAndUpdate({"_id" : new ObjectId(driverId)}, { $set: { "email" : email } }, {returnDocument: "after"});
      if (!updatedDriver || !updatedDriver.value) {
        res.status(404).json({message: "No driver found"});
        return;
      }
      const updatedDriverData: WithId<Document> = updatedDriver.value;
      res.status(200).json({
        _id: updatedDriverData._id,
        name: updatedDriverData.name,
        email: updatedDriverData.email,
        doNotDisturb: updatedDriverData.doNotDisturb
      });
      return;
    } catch(err:any) {
      res.status(500).json({error: err.message});
      return;
    }
  });

  app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'ok' });
  });

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start();