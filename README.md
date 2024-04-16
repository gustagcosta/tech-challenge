AUTH

ROTAS
POST /user
criar usuário com nome email cpf e senha e criptografar senha

POST /login
receber cpf e senha e tentar localizar o usuário se encontrar gerar um jwt e retornar

GET /users [admin only]
retonar todos os usuários do sistema, remover as senhas

BANCO DE DADOS
tabela usuários simples só com os dados de usuário mesmo e um isAdmin para identificarmos os administradores

OBSERVAÇÕES
criar usuário admin no bootstrap do projeto, automatizar

ORDER

POST /order
receber informações do pedido e token bearer no header, autenticar fazendo requisição para microsserviço auth, se não funcionar, cria pedido com o clientId null, validar se produtos são válidos no microsserviço de produtos, pedido tem que ser criado com status RECEBIDO, criar histórico de pedido recebido.

POST /order/:order-id/pay
receber informações para o pagento, checar se pedido está como recebido e se o usuário é o mesmo que criou o pedido caso exista o token, criar histórico de aguardando pagamento, colocar na fila de pagamento, mudar status para AGUARDANDO PAGAMENTO e criar histórico, responder que o pagamento será processado.

PUT /order/callback
vai receber um status e uma string para colocar no histórico, checar se status é diferente do antigo, checar se histórico já não foi criado, certificar de que esse é um endpoint interno

GET /orders [admin only] 
retornar todos os pedidos para o admin, fazer calculo entre primeiro histórico e ultimo para calcular o tempo que o pedido demorou para ser processado.

BANCO DE DADOS
tabela simples com pedidos

PAY 

Esse microserviço vai funcionar ouvindo uma fila ou tópico, então a responsabilidade dele é receber os dados via fila, fazer a integração com o gateway de pagamento e se der certo, colocar na fila de produção e consumir o microserviço de order para atualizar o pedido histórico + status

KITCHEN 

É basicamente igual ao serviço PAY só que ele não precisa efetuar integração, basta receber o valor da fila e mandar o callback informando que o pedido está feito. 

CATALOG

Microserviço básico para fazer o CRUD de produtos, lembrando que as operações de CREATE DELETE E UPDATE devem ser feitas apenas por usuários administradores, o endpoint de LEITURA deve ser público para que o cliente efetue a consulta antes de realizar o pedido.

- 5 microserviços
- um banco de dados de pedidos [ SQL ]
- um banco de dados de usuários [ NOSQL ]
- um banco de dados de produtos [ SQL ]

Opção de mensageria  
1 
- um sns com dois tópicos, para pagamento e um para preparação 
- duas filas sqs para o sns colocar a mensagem nelas, para pagamento e um para preparação

2 
- rabbitmq fazendo sns e sqs

