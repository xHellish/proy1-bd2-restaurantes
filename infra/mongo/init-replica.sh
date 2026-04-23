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
