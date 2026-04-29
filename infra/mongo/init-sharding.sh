#!/usr/bin/env bash
set -e

echo "=== Configuring Sharding on Mongos ==="

echo "Waiting for mongos to be ready..."
until mongosh --host mongos:27017 --eval "db.adminCommand('ping')" --quiet 2>/dev/null; do
  echo "  Mongos not ready yet, retrying in 2s..."
  sleep 2
done

echo "✓ Mongos is ready"

echo "Adding shards to the cluster..."
mongosh --host mongos:27017 <<EOF
// Add shard 1
sh.addShard("shard1rs0/shard1-node1:27017,shard1-node2:27018,shard1-node3:27022")

// Add shard 2
sh.addShard("shard2rs0/shard2-node1:27023,shard2-node2:27024,shard2-node3:27025")

// Display shard status
sh.status()
EOF

echo "✓ Shards added successfully"

echo "Enabling sharding on database and collections..."
mongosh --host mongos:27017 <<EOF
// Enable sharding on the database
sh.enableSharding("restaurantes")

// Create indexes and shard collections
use restaurantes

// Shard products collection by productId (hash sharding for even distribution)
db.products.createIndex({ productId: "hashed" })
sh.shardCollection("restaurantes.products", { productId: "hashed" })

// Shard reservations by userId for tenant isolation
db.reservations.createIndex({ userId: "hashed" })
sh.shardCollection("restaurantes.reservations", { userId: "hashed" })

// Shard menus by restaurantId
db.menus.createIndex({ restaurantId: "hashed" })
sh.shardCollection("restaurantes.menus", { restaurantId: "hashed" })

// Display final sharding configuration
sh.status()
EOF

echo "✓ Sharding configured on all collections"

echo "=== Sharding Configuration Complete ==="
echo ""
echo "Cluster Information:"
mongosh --host mongos:27017 <<EOF
use admin
db.runCommand({ listShards: 1 })
EOF
