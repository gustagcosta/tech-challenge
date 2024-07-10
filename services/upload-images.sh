#!/bin/bash

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 <meu-usuario>"
  exit 1
fi

MEU_USUARIO=$1
TAG="latest"

for dir in */; do
  if [ -d "$dir" ]; then
    MINHA_IMAGEM="tc-${dir%/}"

    echo "Entrando na pasta $dir"
    cd "$dir" || exit

    echo "Construindo a imagem Docker para $MINHA_IMAGEM..."
    docker build -t ${MINHA_IMAGEM}:latest .

    echo "Tagueando a imagem Docker..."
    docker tag ${MINHA_IMAGEM}:latest ${MEU_USUARIO}/${MINHA_IMAGEM}:${TAG}

    echo "Fazendo o upload da imagem para o Docker Hub..."
    docker push ${MEU_USUARIO}/${MINHA_IMAGEM}:${TAG}

    echo "Processo concluído com sucesso para $MINHA_IMAGEM!"

    cd ..
  fi
done
