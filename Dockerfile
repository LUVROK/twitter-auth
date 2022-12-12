FROM node:lts-alpine as INSTALL
WORKDIR /src

COPY ./package.json .
COPY yarn.lock .
RUN yarn install

FROM INSTALL as COPY
COPY . .

FROM COPY AS RUN
EXPOSE 5000
ENTRYPOINT [ "yarn", "serve" ]