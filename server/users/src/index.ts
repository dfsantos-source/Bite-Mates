import { MongoClient, ObjectId } from 'mongodb';
import express, { Request, Response, NextFunction } from 'express';
import { User } from './types/dataTypes';
import cors from "cors";
import logger from "morgan";
import axios from 'axios';
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";


const app = express();
app.use(cors());
app.use(express.json());
app.use(logger("dev"))
const port = 4011;

async function connectDB(): Promise<MongoClient> {
  const uri = process.env.DATABASE_URL;

  if (uri === undefined) {
    throw Error('DATABASE_URL environment variable is not specified');
  }

  const mongo = new MongoClient(uri);
  await mongo.connect();
  return await Promise.resolve(mongo);
}

function verifyToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(" ")[1];

  if (token === undefined) {
    res.status(400).json({ message: "token is missing from header" });
    return
  }

  try {
    if (process.env.ACCESS_TOKEN === undefined) {
      res.status(500).json({ message: "access _token string missing" });
      return;
    }
    const user: string | JwtPayload = jwt.verify(token, process.env.ACCESS_TOKEN) as { _id: string, iat: number };
    req.body.userId = user._id;
    next();
  }
  catch (err) {
    res.status(500).json("token error")
    return
  }

}


async function start() {
  const mongo = await connectDB();

  app.post("/api/users/register", async (req: Request, res: Response) => {
    const { name, address, email, password } = req.body;

    if (name === undefined || address === undefined || email === undefined || password === undefined) {
      res.status(400).json({ message: "request body incomplete" })
      return;
    }

    try {
      const db = mongo.db();

      const hashedPass = await bcrypt.hash(password, 12);

      const userDb = db.collection("users");
      const id = new ObjectId()
      let user: User = {
        _id: id,
        doNotDisturb: false,
        name,
        address,
        email,
        password: hashedPass
      }

      const result = await userDb.insertOne(user);

      if (process.env.ACCESS_TOKEN === undefined) {
        res.status(500).json({ message: "access token missing" })
        return;
      }

      const token = jwt.sign({ _id: id }, process.env.ACCESS_TOKEN, {});

      const event = {
        type: "UserCreated",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          address: user.address,
          doNotDisturb: user.doNotDisturb
        }
      }

      await axios.post("http://eventbus:4000/events", event);

      res.status(201).json({
        user: {
          _id: id,
          name,
          email,
          address,
          doNotDisturb: false
        },
        token: token
      })
    }
    catch (err) {
      res.status(400).json({ message: "Failed creating user" })
    }

  })

  app.post("/api/users/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (email === undefined || password === undefined) {
      res.status(400).json("Body is incomplete");
    }
    else {
      try {
        const db = mongo.db();

        const usersDb = db.collection("users");

        const user = await usersDb.findOne({ email });

        if (user === null) {
          res.status(404).json("Could not find user")
        }
        else {
          const passIsValid = await bcrypt.compare(password, user.password)

          if (process.env.ACCESS_TOKEN === undefined) {
            res.status(500).json("access token is missing");
            return
          }

          const token = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN, {})

          if (passIsValid) {
            res.status(200).json({
              user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                address: user.address,
                doNotDisturb: user.doNotDisturb
              },
              token: token
            })
          }
        }

      } catch (error) {
        res.status(500).json({ message: "server error" })
      }
    }
  })

  app.get("/api/users/get", verifyToken, async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (userId === undefined) {
      res.status(400).json({ message: "userId not found" });
    }
    else {
      try {
        const db = mongo.db()
        const userDb = db.collection("users")

        const user = await userDb.findOne({ _id: new ObjectId(userId) })


        if (user) {
          res.status(200).json(user)
        }

      } catch (error) {

      }

    }
  })

  app.listen(port, () => {
    console.log(`Running on ${port}.`);
  });
}

start()