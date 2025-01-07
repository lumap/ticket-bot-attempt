FROM oven/bun:1.1.42

RUN apt update && apt install -y python3 build-essential

WORKDIR /app

COPY package.json /app

RUN bun i

COPY src/ .
