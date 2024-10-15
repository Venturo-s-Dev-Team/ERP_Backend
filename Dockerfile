FROM node:18-alpine

WORKDIR /erp

# Copia o package.json da pasta server para o diretório de trabalho
COPY server/package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o conteúdo da pasta server para o diretório de trabalho
COPY server/ ./

# Expõe as portas que as APIs usam
EXPOSE 3001 3002

# Comando para iniciar as APIs
CMD ["npm", "start"]
