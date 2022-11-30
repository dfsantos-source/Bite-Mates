import express, { Request, Response } from 'express';

const app = express();
const port = 4004;

app.get('/', (req: Request, res: Response) => {
  res.send({ message: 'ok' });
});

app.listen(port, () => {
  console.log(`Running on ${port}.`);
});