# k8s Discordeno Template/Framework

---

This is designed for people who want a microservice bot, who need high
availability, and with high number of incomeing events.

This project achived:

- Truely zero downtime
- All containerze
- Scale up when dealing with incressing workload
- Native kubernetes support
- Docker compose support

## Roadmap

- command manager (submiting, versioning, auto rollout)
- kubernetes operater (auto deployment)
- Auto scaling for gateway, bot and rest process
- Adapter for coding the bot (event handler) in any language

## Setup (running on kubernetes)

- Rename the `configMap.yaml.example` file to `configMap.yaml`
- Fill out the `.configMap.yaml` file, the default namespace was discordeno
  change if necessary
- Go to `configs.ts` file and remove all the intents you don't want in your bot.
- Apply both configMap.yaml and deploy.yaml

## Setup (running on docker compose)

- Rename the `.env.example` file to `.env`
- Fill out the `.env` file
- Go to `configs.ts` file and remove all the intents you don't want in your bot.
- Run `docker-compose -d up`
