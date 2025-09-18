# ---- Base Node ----
FROM node:20.8.1-bullseye-slim AS base

WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

COPY . .

# ---- Build ----
FROM base AS build

RUN npm run build

# ---- Production ----
FROM node:20.8.1-bullseye-slim AS production

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/dist ./dist

COPY package*.json ./

RUN npm ci --only=production

EXPOSE 3999

CMD ["node", "dist/main"]
