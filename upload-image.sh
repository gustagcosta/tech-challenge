#!/bin/bash

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <meu-usuario> <minha-imagem>"
  exit 1
fi

MEU_USUARIO=$1
MINHA_IMAGEM=$2
TAG="latest"

echo "Construindo a imagem Docker..."
docker build -t ${MINHA_IMAGEM}:latest .

echo "Tagueando a imagem Docker..."
docker tag ${MINHA_IMAGEM}:latest ${MEU_USUARIO}/${MINHA_IMAGEM}:${TAG}

echo "Fazendo o upload da imagem para o Docker Hub..."
docker push ${MEU_USUARIO}/${MINHA_IMAGEM}:${TAG}

echo "Processo concluído com sucesso!"
