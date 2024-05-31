import express from 'express';
import cors from 'cors';

import { createRouteController } from './routes/create-order.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  return res.json({ ok: 'cool' });
});

app.post('/order', createRouteController);

app.listen(3333);
