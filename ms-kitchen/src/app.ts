import amqp from 'amqplib';

async function main() {
  try {
    const connection = await amqp.connect('amqp://localhost');
    connection.on('error', (err) => {
      console.error('Erro na conexão com o RabbitMQ:', err);
      process.exit(1);
    });

    const channel = await connection.createChannel();
    channel.on('error', (err) => {
      console.error('Erro no canal do RabbitMQ:', err);
      process.exit(1);
    });

    const queue = 'mskitchen';

    await channel.assertQueue(queue, { durable: false });

    console.log(`Esperando mensagens em ${queue}`);

    channel.consume(
      queue,
      async (msg) => {
        try {
          if (msg !== null) {
            console.error('Mensagem recebida');

            const message = JSON.parse(msg.content.toString());

            console.log({ message });

            console.error('Mensagem processada');

            channel.ack(msg);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', { error });
          if (msg !== null) {
            channel.reject(msg, false);
          }
        }
      },
      { noAck: false }
    );
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

main();
