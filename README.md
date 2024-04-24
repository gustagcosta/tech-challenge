## AUTH
### ROTAS
#### POST /user
- Criar usuário com nome, email, CPF e senha, e criptografar senha.
#### POST /login
- Receber CPF e senha e tentar localizar o usuário. Se encontrado, gerar um JWT e retornar.
#### GET /users [admin only]
- Retornar todos os usuários do sistema, removendo as senhas.
### BANCO DE DADOS
- Tabela de usuários simples, apenas com os dados do usuário e um campo isAdmin para identificar os administradores.
### OBSERVAÇÕES
- Criar usuário admin no bootstrap do projeto e automatizar.

## ORDER
### POST /order
- Receber informações do pedido e token de identificação de cliente no header, se não vier, criar pedido com o clientId null. 
- Validar se os produtos são válidos no microsserviço de produtos. 
- Pedido deve ser criado com status RECEBIDO. 
- Criar histórico de pedido recebido.
### POST /order/:order-id/pay
- Receber informações para o pagamento. 
- Checar se o pedido está como recebido e se o usuário é o mesmo que criou o pedido, caso exista o token.
- Criar histórico de aguardando pagamento, colocar na fila de pagamento, mudar status para AGUARDANDO PAGAMENTO e criar histórico. 
- Responder que o pagamento será processado.
### PUT /order/callback
- Receber um status e uma string para colocar no histórico. 
- Checar se o status é diferente do anterior, checar se o histórico já não foi criado, certificar de que este é um endpoint interno.
### GET /orders [admin only]
- Retornar todos os pedidos para o admin. 
- Calcular o tempo que o pedido demorou para ser processado entre o primeiro histórico e o último.

### BANCO DE DADOS
- Tabela simples com pedidos.

## PAY
Este microserviço vai funcionar ouvindo uma fila ou tópico. A responsabilidade dele é receber os dados via fila, fazer a integração com o gateway de pagamento e, se der certo, colocar na fila de produção e consumir via http o microserviço de order para atualizar o histórico do pedido e o status.

## KITCHEN
É basicamente igual ao serviço PAY, mas não precisa efetuar integração. Basta receber o valor da fila e mandar o callback informando que o pedido está feito.

## CATALOG
Microserviço básico para fazer o CRUD de produtos. Lembrando que as operações de CREATE, DELETE e UPDATE devem ser feitas apenas por usuários administradores. O endpoint de LEITURA deve ser público para que o cliente efetue a consulta antes de realizar o pedido.

## Informações

- 5 microserviços
- Um banco de dados de pedidos [SQL]
- Um banco de dados de usuários [NoSQL]
- Um banco de dados de produtos [SQL]

Opção de mensageria:
1. Um SNS com dois tópicos, um para pagamento e outro para preparação. Duas filas SQS para o SNS colocar as mensagens nelas, uma para pagamento e outra para preparação.

Cada microserviço com seu repositório separado, contendo testes + análise estatica + ci/cd

Analisar uso de Service discovery