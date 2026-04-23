const { getRestaurantRepository } = require("../repositories");

class RestaurantService {
  constructor() {
    this.repository = getRestaurantRepository();
  }

  async listRestaurants() {
    return this.repository.list();
  }

  async createRestaurant(payload) {
    return this.repository.create(payload);
  }
}

module.exports = RestaurantService;
