# MongoDB Sharding Configuration

## Architecture Overview

This project uses MongoDB sharding for horizontal scalability with the following architecture:

### Components

1. **Config Servers** (Replica Set: `configrs0`)
   - 3 nodes for high availability
   - Stores metadata for the sharded cluster
   - Ports: 27019, 27020, 27021

2. **Shards** (Data stores)
   - **Shard 1** (Replica Set: `shard1rs0`)
     - 3 nodes on ports: 27017, 27018, 27022
   - **Shard 2** (Replica Set: `shard2rs0`)
     - 3 nodes on ports: 27023, 27024, 27025

3. **Mongos Router** (Query Router)
   - Single entry point for all client connections
   - Automatically routes queries to appropriate shards
   - Port: 27017 (from container perspective)

## Sharded Collections

### products
- **Shard Key**: `productId` (hashed)
- **Rationale**: Even distribution of products across shards
- **Chunk Size**: Default (64 MB)

### reservations
- **Shard Key**: `userId` (hashed)
- **Rationale**: Tenant-based isolation, improves query locality
- **Chunk Size**: Default (64 MB)

### menus
- **Shard Key**: `restaurantId` (hashed)
- **Rationale**: Groups restaurant menus together, improves query performance

## Connection

### From Application Code
```
MONGO_URI=mongodb://mongos:27017/restaurantes
```

### Local Development
```bash
# Connect to mongos (router)
mongosh --host localhost:27017

# Check shard status
db.adminCommand({ listShards: 1 })

# View shard distribution
sh.status()
```

## Initialization Process

The `mongodb-setup` service runs three scripts in order:

1. **init-configsvr.sh**: Initializes the config server replica set
2. **init-shards.sh**: Initializes both shard replica sets
3. **init-sharding.sh**: Adds shards to cluster and enables sharding on collections

## Scaling

To add more shards:

1. Add new replica set to docker-compose.yml
2. Update `init-shards.sh` to initialize the new replica set
3. Run `sh.addShard()` in mongos to add it to the cluster
4. Data will automatically rebalance

## Monitoring

### View cluster topology
```javascript
db.adminCommand({ listShards: 1 })
```

### View chunk distribution
```javascript
sh.status()
```

### Check shard key statistics
```javascript
db.collection.aggregate([
  { $bucketAuto: { groupBy: "$shardKey", buckets: 10 } }
])
```

## Troubleshooting

### Shards not connecting
```bash
# Check replica set status on each shard
mongosh --host shard1-node1:27017 --eval "rs.status()"
mongosh --host shard2-node1:27023 --eval "rs.status()"
```

### Config servers not responding
```bash
# Check config server status
mongosh --host config-server-1:27019 --eval "rs.status()"
```

### Unbalanced shards
```javascript
// Manual rebalancing
use admin
db.adminCommand({ balancerStart: 1 })
```
