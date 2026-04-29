# PY01 Restaurantes - Professional Microservices Architecture

**Repo**: https://github.com/xHellish/proy1-bd2-restaurantes  
**Swagger UI**: http://localhost:3000/api/docs (después de `docker-compose up`)

## Descripción General

Sistema de restaurantes con arquitectura de microservicios profesional que implementa:

- **Persistencia Políglota**: Interoperabilidad entre PostgreSQL y MongoDB sin cambios en servicios
- **MongoDB Replica Set + Sharding**: Replicación (1 primario + 2 secundarios) + particionado de datos
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
     │   │  (Users,    │           │       │ (Cache)  │
     │   │   Auth,     │           │       │ 5/10min  │
     │   │   Catalog)  │           │       │ TTL      │
     │   └─────────────┘           │       └──────────┘
     │                             │
     └───────────┬──────────────────┴──────┐
                 │                         │
         ┌───────▼─────────┐      ┌────────▼──────┐
         │  MongoDB Replica │      │ Elasticsearch │
         │  Set + Sharding │      │ (Products     │
         │  (Products,     │      │  Index)       │
         │   Reservs)      │      │               │
         └─────────────────┘      └───────────────┘
```

### Distribución de Datos

| Componente  | Datos                                | Configuración |
|-------------|--------------------------------------|---------------|
| PostgreSQL  | Usuarios, Autenticación, Categorías | No replicado |
| MongoDB     | Productos, Reservaciones            | Replica Set + Sharding (hash) |
| Elasticsearch | Índice textual de productos        | Single-node (desarrollo) |
| Redis       | Respuestas cacheadas de API/Search  | TTL: 5 min (productos), 10 min (búsqueda) |

## Requisitos

- Docker & Docker Compose 20.10+
- Node.js 18+ (solo para desarrollo local sin Docker)
- 4GB RAM mínimo

## Instalación y Ejecución

### Opción 1: Stack Completo (Recomendado)

```bash
# 1. Clonar repositorio
git clone https://github.com/xHellish/proy1-bd2-restaurantes
cd PY01_Restaurantes

# 2. Levantar stack completo
docker-compose up --build

# 3. Verificar salud
curl http://localhost/health               # Nginx gateway
curl http://localhost/api/docs             # Swagger UI
```

### Opción 2: Cambiar a MongoDB

```bash
# En .env cambiar:
DB_ENGINE=mongodb

# Luego:
docker-compose down -v
docker-compose up --build
```

## Escalabilidad - Horizontal Scaling

### Escalar a 3 instancias de API

```bash
docker-compose up -d --scale api=3

# Nginx automáticamente balancea entre ellas
for i in {1..10}; do curl http://localhost/api/health; done
```

## Endpoints Principales

### 🔐 API (Requiere Autenticación)

```
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

## Funcionalidades Implementadas

### ✅ Persistencia Políglota (20%)
- Repository Pattern abstrae DB
- Soporta PostgreSQL + MongoDB intercambiables
- AuthService migrada para soportar ambas persistencias

### ✅ MongoDB Replica Set + Sharding (20%)
- Replica: 1 primario + 2 secundarios
- Sharding: `products` por `_id`, `reservations` por `userId`
- Auto-configurado en docker-compose

### ✅ ElasticSearch (15%)
- Multi-match: nombre (peso 3) + descripción + precio
- Filtro por categoría
- Regla especial: null → "Producto sin descripción"
- Sync automático API → ES

### ✅ Redis Cache (10%)
- TTL: 5 min productos, 10 min búsqueda
- Cache-aside: HIT/MISS headers
- Invalidación en POST/PUT/DELETE

### ✅ Nginx + Escalabilidad (15%)
- Path-based routing
- Load balancing least-conn
- Soporta scaling horizontal

### ✅ CI/CD (GitHub Actions)
- Build Docker images
- Tests con cobertura ≥90%
- Publish a registry

### ✅ Pruebas (10%)
- Jest threshold 90%
- Tests para middleware, indexer, endpoints
- Coverage: líneas, funciones, statements

## Validaciones Técnicas

### MongoDB Sharding
```bash
docker-compose exec mongo1 mongosh

# En mongosh:
sh.status()
# Debe mostrar: 3 shards, 2 colecciones sharded
```

### Redis Cache
```bash
docker exec -it py01_redis redis-cli

# Ver keys
KEYS "cache:*"

# Ver TTL
TTL "cache:/api/products"
```

### Elasticsearch
```bash
# Ver índices
curl http://localhost:9200/_cat/indices

# Buscar
curl "http://localhost:9200/products/_search?q=Producto%20sin%20descripción"
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
│   │   │   ├── indexers/              # Elasticsearch sync
│   │   │   ├── middlewares/           # Auth, cache
│   │   │   └── config/                # DB, env
│   │   ├── tests/                     # Jest tests
│   │   ├── prisma/migrations/         # SQL migrations
│   │   └── Dockerfile
│   │
│   └── search/                        # Microservicio de búsqueda
│       ├── src/
│       │   ├── routes/                # Search endpoints
│       │   ├── indexers/              # Reindex jobs
│       │   ├── middlewares/           # Cache
│       │   └── config/
│       ├── tests/
│       └── Dockerfile
│
├── infra/
│   ├── nginx/nginx.conf               # Reverse proxy + LB
│   └── mongo/init-replica.sh          # Replica set + sharding
│
├── docker-compose.yml
├── .env
└── README.md
```

## Pruebas

```bash
# Todos los tests
npm test

# Con cobertura
npm test -- --coverage

# Modo watch
npm test -- --watch
```

## Próximas Mejoras

1. Kubernetes + Helm charts
2. Prometheus + Grafana monitoring
3. ELK Stack logging centralizado
4. Bull queues para jobs async
5. Rate limiting por usuario/IP
6. GraphQL API

## Licencia

MIT
