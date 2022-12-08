import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from "cors";
import logger from "morgan";

const app = express();
app.use(cors());
app.use(express.json());
app.use(logger("dev"))

const port = 4000;


let eventSubscriptions: { [key: string]: string[] } = {
}

interface subscription {
  eventTypes: string[],
  URL: string
}

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'ok' });
});

app.post("/subscribe", (req: Request, res: Response) => {
  const { eventTypes, URL } = req.body;

  if (eventTypes === undefined || URL === undefined) {
    res.status(400).json("Body incomplete");
  }
  else {
    const sub: subscription = {
      eventTypes,
      URL
    }

    sub.eventTypes.forEach((event) => {
      if (event in eventSubscriptions) {
        eventSubscriptions[event].push(URL)
      }
      else {
        eventSubscriptions[event] = []
        eventSubscriptions[event].push(URL)
      }
    })

    console.log(eventSubscriptions);
    res.status(201).json({ message: "Subscribed to Events" });
  }


})

app.post("/events", async (req: Request, res: Response) => {
  const { type } = req.body;

  if (type === undefined) {
    res.status(400).json("body incomplete")
  }
  else {

    console.log(req.body)
    if (type in eventSubscriptions) {
      let subscribers = eventSubscriptions[type]
      for (let i = 0; i < subscribers.length; i++) {
        await axios.post(subscribers[i], req.body);
      }

      res.status(200).json(`sent event ${type} to subscribers`)
      return;
    }
    else {
      res.status(400).json({ message: `No subscribers for event type: ${type}` })
      return
    }
  }

})

app.listen(port, () => {
  console.log(`Running on ${port}.`);
});