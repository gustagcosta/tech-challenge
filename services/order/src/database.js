import mysql from 'mysql2/promise';

async function dbConnect() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'docker',
      password: 'docker',
      database: 'docker',
    });

    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

export default dbConnect;
