const express = require("express");
const { elastic } = require("../config/elasticsearch");

const router = express.Router();

router.get("/", async (req, res) => {
  const q = req.query.q || "";

  const response = await elastic.search({
    index: "restaurants",
    query: {
      multi_match: {
        query: q,
        fields: ["name^3", "description", "address", "category"]
      }
    }
  });

  return res.status(200).json(response.hits.hits.map((hit) => hit._source));
});

module.exports = router;
