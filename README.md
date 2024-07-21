# Tech Challenge Gustavo

Este repositório tem por objetivo documentar e armazenar todo o trabalho realizado para o Tech Challenge da Pós Tech by FIAP.

- **Autor:** Gustavo Costa
- **Matrícula:** RM351316

O trabalho é composto por 3 tópicos, abordando desafios referentes às 3 disciplinas:

### 1. SAGA Pattern

#### 1.a

O padrão escolhido para o desenvolvimento da SAGA é o **coreografado**. Nele, todos os serviços sabem quais ações tomar em cada etapa. Juntamente com as transações atômicas, garante que o estado da aplicação sempre será consistente. Apesar de ser mais complexo de desenvolver, escolhi este método por ser mais dinâmico e visualizável. Cada serviço precisa apenas se preocupar com seu próprio contexto e, ao cumprir seu objetivo, a SAGA é completada.

#### 1.b

Este tópico pede para arquiteturar o fluxo de pagamento. Veja abaixo o diagrama representando o fluxo da nossa aplicação.

<img src="./docs/saga.png" alt="Diagrama do fluxo SAGA"/>

A apresentação do fluxo no diagrama se dá pelo número 2. O cliente manifesta a intenção de realizar o pagamento, que é recebido e inserido na fila de pagamento. O microsserviço `pay` faz a integração com o gateway e insere na fila `notify`, que é consumida pelo microsserviço `notify`, comunicando ao cliente e ao serviço `order` para atualizar o status do pedido. Caso o pagamento seja aprovado, ele também insere na fila `kitchen`, que, ao terminar o preparo do pedido, insere mais uma notificação, desta vez informando que o pedido está pronto.

Assim, temos um cenário em que, se o pagamento for aprovado, o cliente e a cozinha são notificados. Em caso de reprovação, a cozinha não recebe nada e o cliente é informado do problema.

#### 1.c

O serviço de mensageria utilizado para a solução foi o RabbitMQ, por sua simplicidade e eficiência.

### 2. Desenvolvimento Seguro

