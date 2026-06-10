FROM oven/bun:alpine

WORKDIR /app

RUN apk update && apk upgrade
RUN apk add --no-cache python3 py3-pip && ln -sf /usr/bin/python3 /usr/bin/python

COPY ./src ./src
COPY meta-prod.yml meta.yml
COPY package.json bun.lock LICENSE requirements.txt ./

RUN bun install --frozen-lockfile
RUN python3 -m pip install --break-system-packages --upgrade pip setuptools wheel
RUN python3 -m pip install --break-system-packages -r requirements.txt

CMD [ "bun", "run", "run" ]

EXPOSE 3000