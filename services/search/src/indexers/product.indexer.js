const { elastic } = require("../config/elasticsearch");

async function indexProduct(product) {
  return elastic.index({
    index: "products",
    id: String(product.id),
    document: product,
    refresh: true
  });
}

async function indexBulkProducts(products) {
  if (!products || products.length === 0) return;

  const body = products.flatMap((product) => [
    { index: { _index: "products", _id: String(product.id) } },
    product
  ]);

  return elastic.bulk({ body, refresh: true });
}

module.exports = {
  indexProduct,
  indexBulkProducts
};
