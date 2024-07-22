import dbConnect from '../database.js';
import crypto from 'crypto';

export const createOrderController = async (req, res) => {
  const connection = await dbConnect();

  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const userToken = authHeader.split(' ')[1];

      const userResponse = await fetch(`http://${process.env.AUTH_URL}/api/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (userResponse.status === 200) {
        const userData = await userResponse.json();
        userId = userData.id;
      } else {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
    }

    const data = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Body não fornecido' });
    }

    const items = data.items;

    if (!items || items.length <= 0) {
      return res.status(400).json({ message: 'Itens não fornecidos' });
    }

    const validateProductResponse = await fetch(`http://${process.env.CATALOG_URL}/api/products/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items.map((i) => i.id)),
    });

    if (!validateProductResponse.ok) {
      return res.status(400).json({ message: 'Itens inválidos' });
    }

    await connection.beginTransaction();

    const orderId = crypto.randomUUID();

    await connection.execute('INSERT INTO `order` (id, products, status, user_id) VALUES (?, ?, ?, ?)', [
      orderId,
      JSON.stringify(items),
      'RECEBIDO',
      userId,
    ]);

    await connection.execute(
      'INSERT INTO `order_history` (id, order_id, old_status, new_status, msg) VALUES (?, ?, ?, ?, ?)',
      [crypto.randomUUID(), orderId, null, 'RECEBIDO', 'Pedido recebido']
    );

    await connection.commit();
    await connection.end();

    return res.status(201).json({ orderId });
  } catch (error) {
    console.error({ error });
    if (connection) await connection.rollback();
    return res.status(500).send('Erro interno');
  } finally {
    if (connection) await connection.end();
  }
};
