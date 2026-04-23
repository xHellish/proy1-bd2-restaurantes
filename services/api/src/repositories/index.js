const env = require("../config/env");
const RestaurantPostgresRepository = require("./postgres/restaurant.postgres.repository");
const RestaurantMongoRepository = require("./mongodb/restaurant.mongodb.repository");

function getRestaurantRepository() {
  if (env.dbEngine === "mongodb") {
    return new RestaurantMongoRepository();
  }

  return new RestaurantPostgresRepository();
}

module.exports = {
  getRestaurantRepository
};
