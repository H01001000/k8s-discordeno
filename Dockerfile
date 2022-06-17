#denoland/deno:alpine-1.22.1
#lukechannings/deno:v1.22.1

FROM lukechannings/deno:v1.22.1 as deps
WORKDIR /app
USER deno
COPY deps.ts .
RUN deno cache deps.ts
COPY configs.ts .
COPY importMap.json .
COPY src/utils src/utils
COPY src/constants src/constants

FROM lukechannings/deno:v1.22.1 as rest
COPY --from=deps /deno-dir /deno-dir
COPY --from=deps /app /app
WORKDIR /app
COPY src/rest src/rest
RUN mkdir -p /var/tmp/log
EXPOSE 8000
CMD ["run", "-A", "--unstable", "--import-map", "./importMap.json", "--no-check", "./src/rest/mod.ts"]

FROM lukechannings/deno:v1.22.1 as gateway
COPY --from=deps /deno-dir /deno-dir
COPY --from=deps /app /app
WORKDIR /app
COPY src/gateway src/gateway
RUN mkdir -p /var/tmp/log
EXPOSE 8000
CMD ["run", "-A", "--unstable", "--import-map", "./importMap.json", "--no-check", "./src/gateway/mod.ts"]

FROM lukechannings/deno:v1.22.1 as bot
COPY --from=deps /deno-dir /deno-dir
COPY --from=deps /app /app
WORKDIR /app
COPY src/bot src/bot
RUN mkdir -p /var/tmp/log
EXPOSE 8000
CMD ["run", "-A", "--unstable", "--import-map", "./importMap.json", "--no-check", "./src/bot/mod.ts"]

FROM rabbitmq:3.9.20-management-alpine as rabbitmq
COPY src/rabbitmq/plugins plugins
RUN rabbitmq-plugins enable rabbitmq_message_deduplication
