import express from 'express';
import cors from 'cors';

import { createOrderController } from './routes/create-order.js';
import { payOrderControler } from './routes/pay-order.js';
import { callbackController } from './routes/callback.js';
import { getOrderController } from './routes/get-order.js';

const app = express();
const apiRouter = express.Router();

app.use(cors());
app.use(express.json());

apiRouter.post('/order', createOrderController);
apiRouter.post('/order/:order_id/pay', payOrderControler);
apiRouter.post('/order/callback', callbackController);
apiRouter.get('/order/:order_id', getOrderController);

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  return res.json({ ok: 'cool' });
});

app.listen(8083, () => console.log('running on port 8083'));
