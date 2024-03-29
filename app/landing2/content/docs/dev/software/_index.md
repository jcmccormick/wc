---
title: "Software"
weight: 5
---

## [&#128279;](#software) Software

In no particular order, the following lists the third-party software used in Awayto, along with their key features and a primary source for  usage in the system:

| Technology | Description | Source |
|-|-|-|
| Shell | Command-line interface scripting | [/bin]({{< param "repoURL" >}}/tree/main/bin) |
| Typescript | Primary types, api handlers, and components | [/core]({{< param "repoURL" >}}/tree/main/core) |
| Docker | Container service, docker compose, supports cloud deployments | [docker-compose.yaml]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| Kubernetes | Distributed container environment, optional manual deployment path | [/kube]({{< param "repoURL" >}}/tree/main/kube) |
| Postgres | Primary database | [/db]({{< param "repoURL" >}}/tree/main/db) |
| SQLite | File system database | [/fs]({{< param "repoURL" >}}/tree/main/fs) |
| Node.js | Primary runtime environment |-|
| Yarn | Package management | [api package]({{< param "repoURL" >}}/blob/main/api/package.json), [app package]({{< param "repoURL" >}}/blob/main/app/website/package.json) |
| Express.js | API, webhooks | [/api]({{< param "repoURL" >}}/tree/main/api) |
| Bind9 | Nameservers | [ns up]({{< param "repoURL" >}}/blob/main/bin/up/ns) |
| Nginx | Reverse proxy, application server, exit server | [exit server]({{< param "repoURL" >}}/blob/main/deploy/exit.nginx.conf), [reverse proxy]({{< param "repoURL" >}}/tree/main/app/server) |
| ModSecurity | Server security, OWASP coverage | [modsec install]({{< param "repoURL" >}}/blob/main/bin/install/modsec) |
| Fail2Ban | Server security | [exit up]({{< param "repoURL" >}}/blob/main/bin/up/exit) |
| EasyRSA | Internal certificate authority | [builder up]({{< param "repoURL" >}}/blob/main/bin/up/builder) |
| Let's Encrypt | External certificate authority | [ns up]({{< param "repoURL" >}}/blob/main/bin/up/ns) |
| Tailscale | Managed VPN | [deployment up]({{< param "repoURL" >}}/blob/main/bin/up.sh) |
| Hetzner | Cloud deployment variant | [deployment up]({{< param "repoURL" >}}/blob/main/bin/up.sh) |
| AWS | Cloud deployment variant (Future release) |-|
| Keycloak | Authentication and authorization, SSO, SAML, RBAC | [/auth]({{< param "repoURL" >}}/tree/main/auth) |
| Redis | In-memory data store | [redis api module]({{< param "repoURL" >}}/blob/main/api/src/modules/redis.ts) |
| Graylog | Log management and analysis, status dashboards | [graylog api module]({{< param "repoURL" >}}/blob/main/api/src/modules/logger.ts), [content pack]({{< param "repoURL" >}}/blob/main/deploy/graylog-content-pack.json) |
| MongoDB | Logging database | [container only]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| ElasticSearch | Logging database | [container only]({{< param "repoURL" >}}/blob/main/docker-compose.yml) |
| Hugo | Static site generator for landing, documentation, marketing | [/app/landing]({{< param "repoURL" >}}/tree/main/app/landing) |
| React | Front-end application library, Craco build customized | [/app/website]({{< param "repoURL" >}}/tree/main/app/website) |
| ReduxJS Toolkit | React state management and API service | [redux store]({{< param "repoURL" >}}/blob/main/app/website/src/hooks/store.ts) |
| DayJS | Scheduling and time management library | [time utilities]({{< param "repoURL" >}}/blob/main/core/src/types/time_unit.ts) |
| Material-UI | React UI framework based on Material Design | [module components]({{< param "repoURL" >}}/tree/main/app/website/src/modules) |
| Wizapp | Custom wrapper around OpenAI API | [custom prompts]({{< param "repoURL" >}}/blob/main/api/src/modules/prompts.ts)
| Coturn | TURN & STUN server for WebRTC based voice and video calling | [/turn]({{< param "repoURL" >}}/tree/main/turn) |
| WebSockets | Dedicated websocket server for messaging orchestration, interactive whiteboard | [/sock]({{< param "repoURL" >}}/tree/main/sock) |