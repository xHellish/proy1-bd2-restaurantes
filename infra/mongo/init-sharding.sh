#!/usr/bin/env bash
set -e

echo "Esperando a que mongo1 este listo..."
until mongosh --host mongo1:27017 --eval "db.adminCommand('ping')" --quiet; do
  echo "  mongo1 no disponible aun, reintentando en 2s..."
  sleep 2
done

echo "Iniciando replica set rs0..."
mongosh --host mongo1:27017 <<EOF
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27018" },
    { _id: 2, host: "mongo3:27019" }
  ]
})
EOF

echo "Replica set iniciado correctamente."

echo "Esperando a que replica set esté en estado PRIMARY..."
sleep 3

echo "Habilitando sharding..."
mongosh --host mongo1:27017 <<EOF
// Habilitar sharding en la base de datos
sh.enableSharding("restaurantes")

// Crear shard keys
db.products.createIndex({ _id: "hashed" })
sh.shardCollection("restaurantes.products", { _id: "hashed" })

db.reservations.createIndex({ userId: "hashed" })
sh.shardCollection("restaurantes.reservations", { userId: "hashed" })

// Verificar sharding
sh.status()
EOF

echo "Sharding configurado correctamente."
