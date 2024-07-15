import express from 'express';
import cors from 'cors';

import { createOrderController } from './routes/create-order.js';
import { payOrderControler } from './routes/pay-order.js';
import { callbackController } from './routes/callback.js';
import { getOrderController } from './routes/get-order.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  return res.json({ ok: 'cool' });
});

app.post('/order', createOrderController);
app.post('/order/:order_id/pay', payOrderControler);
app.post('/order/callback', callbackController);
app.get('/order/:order_id', getOrderController);

app.listen(8083, () => console.log('running on port 8083'));
