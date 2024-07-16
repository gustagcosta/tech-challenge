#!/bin/sh

# Verifica se a URL do projeto foi passada como argumento
if [ -z "$1" ]; then
  echo "Uso: $0 <url-do-projeto>"
  exit 1
fi

# Define a URL do projeto a partir do primeiro argumento
PROJECT_URL=$1

# Inicia o OWASP ZAP em modo daemon
docker run -u zap -p 8080:8080 -d zaproxy/zap-stable zap.sh -daemon -port 8080 -host 0.0.0.0 -config api.disablekey=true

# Aguarda o ZAP iniciar
echo "Aguardando OWASP ZAP iniciar..."
sleep 15

# Inicia o Spider
echo "Iniciando Spider em $PROJECT_URL..."
docker run -i zaproxy/zap-stable zap-cli --zap-url http://localhost:8080 spider $PROJECT_URL

# Aguarda o Spider concluir
echo "Aguardando Spider concluir..."
sleep 10

# Inicia a varredura ativa
echo "Iniciando varredura ativa em $PROJECT_URL..."
docker run -i zaproxy/zap-stable zap-cli --zap-url http://localhost:8080 active-scan --scanners all $PROJECT_URL

# Geração de relatório
echo "Gerando relatório..."
docker run -i zaproxy/zap-stable zap-cli --zap-url http://localhost:8080 report -o zap_report.html -f html

echo "Varredura concluída. Relatório gerado em zap_report.html"
