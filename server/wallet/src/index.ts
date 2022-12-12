import express, { Request, Response, NextFunction } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import cors from 'cors';
import jwt, { JwtPayload } from "jsonwebtoken";


const app = express();
app.use(express.json());
app.use(cors());
const port = 4012;

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

async function start() {
  const mongo = await connectDB();

  app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'ok' });
  });

  app.post('/events', verifyUserToken, async (req: Request, res: Response) => {
    const event = req.body;
    const db = mongo.db();
    const wallets = db.collection("wallets");
    if(event.type === "OrderCreated"){
      const delivery = event.data;
      let curStatus = "ordered";
      try{
        const wallet = await wallets.findOne({userId: new ObjectId(delivery.userId)});
        if(wallet !== null){
          if(wallet.balance >= delivery.totalPrice){
            await wallets.updateOne({userId: new ObjectId(delivery.userId)}, {$inc: {balance: (-delivery.totalPrice)}});
          }
          else{
            curStatus = "rejected";
          }
        }
        else{
          throw new Error;
        }
      }
      catch{
        res.status(404).send({ message: 'Wallet or User not found.' });
      }

      const processedDelivery = {
        type : "OrderProcessed",
        data : {...delivery, driverId: null, status: curStatus}
      } 

      await axios.post('http://eventbus:4000/events', processedDelivery).catch((err) => {
        console.log(err.message);
      });

      res.status(200).json({order: processedDelivery , message: 'Order processed successfully.' });
    }
    if(event.type === "UserCreated"){
      const user = event.data;
      const newWallet = {
        userId: user._id,
        balance: 100
      }
      wallets.insertOne(newWallet);
      res.status(200).json({wallet: newWallet , message: 'Wallet created successfully.' });
    }
  });

  app.put('/api/wallet/update', verifyUserToken, async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    const wallets = db.collection("wallets");
    if(body.userId !== null){
      const wallet = await wallets.findOne({userId: new ObjectId(body.userId)});
      if(wallet === null){
        res.status(404).send({ message: 'Wallet or User not found.' });
      }
      else{
        const updatedWallet = await wallets.findOneAndUpdate({userId: new ObjectId(body.userId)}, {$inc: {balance: body.balance}}, {returnDocument : "after"});
        console.log(updatedWallet);

        const updatedWalletEvent = {
          type: "MoneyAdded",
          data: updatedWallet
        }

        axios.post('http://eventbus:4000/events', updatedWallet).catch((err) => {
          console.log(err.message);
        });
        res.status(200).json({wallet: updatedWalletEvent, message: 'Balance successfully added.' });
      }
    }
    else{
      res.status(400).send({ message: 'Userid not found.' });
    }
  });

  app.get('/api/wallet/get', verifyUserToken, async (req: Request, res: Response) => {
    const userid = req.body.userid;
    const db = mongo.db();
    const wallets = db.collection("wallets");
    if(userid !== null){
      const wallet = await wallets.findOne({userId: new ObjectId(userid)});
      if(wallet === null){
        res.status(404).send({ message: 'Wallet or User not found.' });
      }
      else{
        res.status(200).json({wallet: wallet, message: 'Wallet found successfully.' });
      }
    }
    else{
      res.status(400).send({ message: 'Userid not found.' });
    }
  });

  const eventSubscriptions = ["OrderCreated", "UserCreated"];
  const eventURL = "http://wallet:4012/events"

  await axios.post("http://eventbus:4000/subscribe", {
    eventTypes: eventSubscriptions,
    URL: eventURL
  })

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start() 