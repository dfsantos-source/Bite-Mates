### Specify a base image
From node:alpine

WORKDIR /usr/app

#Install Dependencies
COPY ./package.json ./
RUN npm install
COPY ./ ./

#Command
CMD ["npm", "run", "dev"]