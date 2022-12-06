import express, { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());
const port = 4012;

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

  app.post('/events', async (req: Request, res: Response) => {
    const event = req.body;
    const delivery = event.data;
    const db = mongo.db();
    const wallets = db.collection("wallet");
    if(event.type === "OrderCreated"){
      let curStatus = "ordered";
      try{
        const walletPromise = await wallets.findOne({userid: delivery.userid});
        if(walletPromise !== null){
          const wallet = walletPromise.data;
          if(wallet.balance <= event.totalPrice){
            wallets.updateOne({userid: delivery.userid}, {$inc: {balance: (-delivery.totalPrice)}});
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
        type : "OrderProccessed",
        data : {...delivery, driverid: null, status: curStatus}
      } 

      axios.post('http://eventbus:4000/events', processedDelivery).catch((err) => {
        console.log(err.message);
      });
    }
  });

  app.put('/api/wallet/update', async (req: Request, res: Response) => {
    const body = req.body;
    const db = mongo.db();
    const wallets = db.collection("wallet");
    if(body.userid !== null){
      const wallet = await wallets.findOne({userid: body.userid});
      if(wallet === null){
        res.status(404).send({ message: 'Wallet or User not found.' });
      }
      else{
        const updatedWallet = await wallets.findOneAndUpdate({userid: body.userid}, {$inc: {balance: body.balance}}, {returnDocument : "after"});
        res.status(200).json({wallet: updatedWallet, message: 'Balance successfully added.' });
      }
    }
    else{
      res.status(400).send({ message: 'Userid not found.' });
    }
  });

  app.get('/api/wallet/get/:userid', async (req: Request, res: Response) => {
    const userid = req.params.userid;
    const db = mongo.db();
    const wallets = db.collection("wallet");
    if(userid !== null){
      const wallet = await wallets.findOne({userid: userid});
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

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()