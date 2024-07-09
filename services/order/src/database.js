import mysql from 'mysql2/promise';

async function dbConnect() {
  try {
    const connection = await mysql.createConnection({
      host: "192.168.49.2",
      user: "docker",
      password: "docker",
      database: "docker",
      port: "32743"
    });

    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

export default dbConnect;
