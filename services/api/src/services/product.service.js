const { getProductRepository } = require("../repositories");

class ProductService {
  constructor() {
    this.repository = getProductRepository();
  }

  async listProducts() {
    return this.repository.list();
  }

  async getProduct(id) {
    return this.repository.findById(id);
  }

  async createProduct(payload) {
    return this.repository.create(payload);
  }

  async updateProduct(id, payload) {
    return this.repository.update(id, payload);
  }

  async deleteProduct(id) {
    return this.repository.delete(id);
  }
}

module.exports = ProductService;
