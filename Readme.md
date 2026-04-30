# PY01 Restaurantes - Professional Microservices Architecture

**Repo**: https://github.com/xHellish/proy1-bd2-restaurantes  
**Swagger UI**: http://localhost/api/docs (después de `docker-compose up`)

## Descripción General

Sistema de restaurantes con arquitectura de microservicios profesional que implementa:

- **Persistencia Políglota**: Interoperabilidad entre PostgreSQL y MongoDB sin cambios en servicios
- **MongoDB Sharded Cluster**: 2 shards (cada uno con 3 réplicas) + 3 config servers + Mongos router
- **Búsqueda Textual Avanzada**: ElasticSearch con multi-match y filtrado por categorías
- **Caché Distribuido**: Redis con TTL y cache-aside pattern
- **Balanceo de Carga**: Nginx reverse proxy con load balancing automático
- **Escalabilidad Horizontal**: Docker Compose permite escalar servicios dinámicamente
- **CI/CD**: GitHub Actions + Docker + Jest (≥90% cobertura)

## Arquitectura

### Diagrama de Componentes

```
┌────────────────────────────────────────────────────────────┐
│              Nginx (Reverse Proxy & LB)                    │
│        /api/** → API | /search/** → Search                │
└─────┬────────────────────────────────────┬──────────────────┘
      │                                    │
  ┌───▼──────────────┐         ┌──────────▼────────┐
  │  API Service     │         │ Search Service    │
  │  (port 3000)     │         │ (port 4000)       │
  │ - Controllers    │         │ - Endpoints       │
  │ - Repositories   │         │ - Reindex Jobs    │
  │ - Services       │         │ - Cache Mw        │
  └──┬────────┬──────┘         └────┬──────────┬───┘
     │        │                     │          │
     │   ┌────▼────────┐           │       ┌───▼──────┐
     │   │  PostgreSQL │           │       │ Redis    │
     │   │  (o MongoDB │           │       │ (Cache)  │
     │   │   según     │           │       │ 5/10min  │
     │   │   config)   │           │       │ TTL      │
     │   └─────────────┘           │       └──────────┘
     │                             │
     └───────────┬──────────────────┴──────┐
                 │                         │
  ┌──────────────▼──────────────┐ ┌────────▼──────┐
  │  MongoDB Sharded Cluster   │ │ Elasticsearch │
  │  ┌─────────┐ ┌──────────┐ │ │ (Products     │
  │  │ Shard 1 │ │ Shard 2  │ │ │  Index)       │
  │  │ (3 rep) │ │ (3 rep)  │ │ │               │
  │  └────┬────┘ └────┬─────┘ │ └───────────────┘
  │       └────┬───────┘       │
  │       ┌────▼────┐          │
  │       │ Mongos  │          │
  │       │ Router  │          │
  │       └─────────┘          │
  │  ┌────────────────┐        │
  │  │ 3 Config Svrs  │        │
  │  └────────────────┘        │
  └────────────────────────────┘
```

### Distribución de Datos

| Componente    | Datos                                | Configuración                          |
|---------------|--------------------------------------|----------------------------------------|
| PostgreSQL    | Todos (modo postgres)                | Single instance                        |
| MongoDB       | Todos (modo mongodb)                 | Sharded: 2 shards × 3 réplicas        |
| Elasticsearch | Índice textual de productos          | Single-node (desarrollo)               |
| Redis         | Respuestas cacheadas de API/Search   | TTL: 5 min (productos), 10 min (menús) |

### MongoDB Sharding

Las siguientes colecciones están sharded con hash-based partitioning:

| Colección      | Shard Key        | Distribución                |
|----------------|------------------|-----------------------------|
| `products`     | `productId` hash | Distribución uniforme       |
| `reservations` | `userId` hash    | Aislamiento por tenant      |
| `menus`        | `restaurantId`   | Agrupación por restaurante  |

## Requisitos

- Docker & Docker Compose 20.10+
- Node.js 22+ (solo para desarrollo local sin Docker)
- **8GB RAM mínimo** (el cluster sharded usa ~4GB)

## Instalación y Ejecución

### Opción 1: Stack Completo con PostgreSQL (Por defecto)

```bash
# 1. Clonar repositorio
git clone https://github.com/xHellish/proy1-bd2-restaurantes
cd PY01_Restaurantes

# 2. Levantar stack completo
docker-compose up --build

# 3. Esperar a que todos los servicios estén listos (~2-3 minutos)
# Los logs mostrarán "✓ Sharding configured on all collections"

# 4. Verificar salud
curl http://localhost/health               # Nginx gateway
curl http://localhost/api/docs             # Swagger UI

# 5. (Opcional) Cargar datos de prueba
docker-compose exec api node infra/scripts/seed-data.js
```

### Opción 2: Cambiar a MongoDB

```bash
# 1. En .env cambiar:
DB_ENGINE=mongodb

# 2. Recrear stack
docker-compose down -v
docker-compose up --build

# 3. Cargar datos de prueba en MongoDB
docker-compose exec api sh -c "DB_ENGINE=mongodb node infra/scripts/seed-data.js"
```

### Cambiar entre Motores de Base de Datos

El sistema usa el **patrón Repository** para abstraer la capa de persistencia. El cambio entre PostgreSQL y MongoDB se realiza **exclusivamente** modificando la variable `DB_ENGINE` en el archivo `.env`:

```bash
# PostgreSQL (default)
DB_ENGINE=postgres

# MongoDB (sharded cluster)
DB_ENGINE=mongodb
```

**Importante**: Después de cambiar el motor:
1. Ejecutar `docker-compose down -v` para limpiar volúmenes
2. Ejecutar `docker-compose up --build` para reconstruir
3. Cargar seed data con el motor apropiado

No se requieren cambios en código fuente. La lógica de negocio en `services/` es idéntica para ambos motores.

## Datos de Prueba (Seed Data)

El script `infra/scripts/seed-data.js` genera datos realistas diseñados con asistencia de LLMs:

- **8 categorías** de comida (Entradas, Platos Fuertes, Pastas, Mariscos, etc.)
- **5 restaurantes** guatemaltecos con direcciones y descripciones reales
- **32 productos** con precios, descripciones detalladas y categorías
- **5 usuarios** (1 admin + 4 customers)
- **5 menús** con productos asignados
- **10 reservaciones** con estados variados

Algunos productos tienen descripción `null` o vacía para probar la regla de normalización de ElasticSearch (`"Producto sin descripción"`).

```bash
# Con PostgreSQL
DB_ENGINE=postgres node infra/scripts/seed-data.js

# Con MongoDB
DB_ENGINE=mongodb MONGO_URI=mongodb://mongos:27017/restaurantes node infra/scripts/seed-data.js
```

## Escalabilidad - Horizontal Scaling

### Escalar a 3 instancias de API

```bash
docker-compose up -d --scale api=3

# Nginx automáticamente balancea entre ellas
for i in {1..10}; do curl http://localhost/api/health; done
```

### Escalar Search

```bash
docker-compose up -d --scale search=2
```

## Endpoints Principales

### 🔐 API (Requiere Autenticación)

```
POST   /api/auth/register         # Registrar usuario
POST   /api/auth/login             # Login → JWT token

GET    /api/products              # Listar (cached 5 min)
POST   /api/products (admin)      # Crear → sincroniza a ES
PUT    /api/products/:id (admin)  # Actualizar → sincroniza a ES
DELETE /api/products/:id (admin)  # Eliminar → sincroniza a ES

GET    /api/menus                 # Listar (cached 10 min)
GET    /api/categories            # Listar (cached 10 min)
GET    /api/reservations          # Mis reservaciones
```

### 🔍 Search (Público)

```
GET /search/products?q=pizza              # Búsqueda textual (cached)
GET /search/products/category/:categoryId # Por categoría (cached)
POST /search/reindex (admin)              # Reindexar base de datos
```

## CI/CD Pipeline

El pipeline de GitHub Actions ejecuta automáticamente:

1. **Test & Quality** (en cada push/PR a main):
   - Lint con ESLint
   - Tests unitarios con Jest
   - Verificación de cobertura ≥ 90%

2. **Build & Push** (solo en push a main):
   - Construye imágenes Docker para `api` y `search`
   - Publica en GitHub Container Registry (ghcr.io)

3. **Notificaciones** del estado del pipeline

## Pruebas

```bash
# Todos los tests
npm test

# Con cobertura
npm test -- --coverage

# Solo API
npm --workspace services/api test

# Solo Search
npm --workspace services/search test
```

### Cobertura
- **Pruebas unitarias**: Services, middlewares, routes, indexers
- **Threshold**: 90% líneas, 90% funciones, 90% statements, 80% branches
- **22+ archivos de test** cubriendo ambos servicios

## Validaciones Técnicas

### MongoDB Sharding
```bash
# Conectar al router mongos
docker exec -it py01_mongos mongosh

# En mongosh:
sh.status()
# Debe mostrar: 2 shards, 3 colecciones sharded (products, reservations, menus)
```

### Redis Cache
```bash
docker exec -it py01_redis redis-cli

# Ver keys
KEYS "cache:*"

# Ver TTL de una key
TTL "cache:/api/products"
```

### Elasticsearch
```bash
# Ver índices
curl http://localhost:9200/_cat/indices

# Buscar productos
curl "http://localhost/search/products?q=pizza"
```

## Estructura de Carpetas

```
PY01_Restaurantes/
├── services/
│   ├── api/                           # Microservicio principal
│   │   ├── src/
│   │   │   ├── routes/                # Controllers HTTP
│   │   │   ├── services/              # Lógica de negocio
│   │   │   ├── repositories/          # Repository pattern
│   │   │   │   ├── interfaces/        # Contratos abstractos
│   │   │   │   ├── postgres/          # Implementación Prisma
│   │   │   │   └── mongodb/           # Implementación Mongoose
│   │   │   ├── indexers/              # Elasticsearch sync
│   │   │   ├── middlewares/           # Auth, cache
│   │   │   └── config/                # DB, env, ES
│   │   ├── tests/                     # Jest tests (22+ archivos)
│   │   ├── prisma/migrations/         # SQL migrations
│   │   └── Dockerfile
│   │
│   └── search/                        # Microservicio de búsqueda
│       ├── src/
│       │   ├── routes/                # Search endpoints
│       │   ├── indexers/              # Reindex jobs (PG + Mongo)
│       │   ├── middlewares/           # Cache
│       │   └── config/
│       ├── tests/
│       └── Dockerfile
│
├── infra/
│   ├── nginx/nginx.conf               # Reverse proxy + LB
│   ├── mongo/
│   │   ├── init-configsvr.sh          # Config server replica set
│   │   ├── init-shards.sh             # Shard replica sets (2 shards)
│   │   ├── init-sharding.sh           # Mongos: add shards + shard collections
│   │   └── init-replica.sh            # Simple replica set (legacy)
│   └── scripts/
│       └── seed-data.js               # Datos de prueba (LLM-generated)
│
├── .github/workflows/
│   ├── ci.yml                         # Test + Build + Publish
│   ├── docker-publish.yml             # Manual/scheduled publish
│   └── pre-commit.yml                 # Pre-commit checks
│
├── docs/                              # Documentación técnica
├── docker-compose.yml                 # Stack completo con sharding
├── docker-compose.test.yml            # Stack para tests
├── ARCHITECTURE.md                    # Documentación C4 + data flows
├── .env                               # Configuración
└── README.md
```

## Licencia

MIT
