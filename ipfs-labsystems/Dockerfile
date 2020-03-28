# base image
FROM node:12.2.0-alpine
    
# set working directory
WORKDIR /ipfs/
# expose IPFS server port
EXPOSE 5002

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh
    
# add `/ipfs/node_modules/.bin` to $PATH
ENV PATH /ipfs/node_modules/.bin:$PATH

# install and cache app dependencies
COPY package.json /ipfs/package.json

RUN npm install 

CMD node index.js