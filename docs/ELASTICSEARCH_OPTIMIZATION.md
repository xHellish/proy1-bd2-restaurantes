# ElasticSearch Optimization Guide

## Index Configuration

### Products Index

**Shards**: 2 (for distributed indexing)
**Replicas**: 1 (for high availability)

**Analyzers**:
- **text_analyzer**: Standard tokenization with lowercase, stop words, and snowball stemming
- **autocomplete_analyzer**: Edge n-gram tokenization for prefix matching

**Key Fields**:
- `name`: Full-text searchable with autocomplete support (3x boost)
- `description`: Full-text searchable (2x boost)
- `price`: Numeric, sortable, filterable
- `categoryId`: Keyword for faceting and filtering
- `restaurantId`: Keyword for filtering by restaurant
- `available`: Boolean for availability filter
- `rating`: Float for sorting and filtering

### Restaurants Index

**Shards**: 2
**Replicas**: 1

**Key Fields**:
- `name`: Full-text searchable (primary)
- `description`: Full-text searchable
- `address`: Full-text searchable
- `category`: Keyword for faceting
- `openingHours`: Nested object for complex queries

## Search Features

### 1. Full-Text Search with Fuzziness
```javascript
multi_match: {
  query: "prosutto", // typo tolerance
  fields: ["name^3", "description^2", "tags"],
  fuzziness: "AUTO"
}
```

### 2. Autocomplete
- Edge n-gram filter enables prefix matching
- Minimum 2 characters for efficiency
- Returns unique suggestions with deduplication

### 3. Advanced Filtering
- Price ranges (minPrice, maxPrice)
- Availability status
- Category and restaurant filtering
- Rating thresholds

### 4. Aggregations
- Price range distribution
- Top categories
- Average ratings
- Used for faceted navigation

### 5. Sorting Options
- **relevance**: Elasticsearch score (default)
- **price_asc**: Low to high
- **price_desc**: High to low
- **rating**: Best rated first
- **newest**: Most recent first

## Performance Optimization

### Indexing Strategy
1. **Refresh Interval**: Default 1 second for near-real-time search
2. **Mapping**: Optimized field types (keyword vs text)
3. **Analysis**: Pre-analyzed at index time for fast search

### Query Optimization
1. **Pagination**: Limit to 100 items per page
2. **Field Selection**: Use `_source` to limit returned fields
3. **Aggregations**: Pre-computed in search response
4. **Filters**: Applied before query scoring for efficiency

### Scaling Strategy
1. **Shards**: Distribute data across 2 shards
2. **Replicas**: Each shard has 1 replica for resilience
3. **Thread Pools**: ES manages automatic load balancing

## Monitoring

### Index Health
```javascript
// Get index stats
GET /products/_stats

// Get index mapping
GET /products/_mapping

// Get index settings
GET /products/_settings
```

### Search Performance
```javascript
// Profile a query
GET /products/_search?profile=true

// Get slow logs
GET /_nodes/stats/indices/search

// Index stats
GET /products/_stats/docs,store
```

## Maintenance

### Reindexing
When mapping changes are needed:
```javascript
// Create new index with updated mapping
PUT /products_v2 { mapping }

// Reindex data
POST /_reindex {
  source: { index: "products" },
  dest: { index: "products_v2" }
}

// Switch alias
POST /_aliases {
  actions: [
    { remove: { index: "products", alias: "products" } },
    { add: { index: "products_v2", alias: "products" } }
  ]
}
```

### Cleanup
```javascript
// Delete old documents
DELETE /products/_docs/_query {
  query: { range: { createdAt: { lt: "2024-01-01" } } }
}

// Force merge (after bulk deletes)
POST /products/_forcemerge?max_num_segments=1
```

## Connection String
```
ELASTIC_URL=http://elasticsearch:9200
```

## Troubleshooting

### No results found
1. Check if index exists: `GET /_cat/indices`
2. Check if documents are indexed: `GET /products/_count`
3. Verify query syntax with `_validate/query`

### Slow queries
1. Profile the query: `?profile=true`
2. Check shard distribution
3. Reduce aggregation complexity
4. Consider pagination optimization

### Memory issues
1. Check heap size: `GET /_nodes/stats/jvm`
2. Monitor field data cache: `GET /_cat/fielddata`
3. Adjust circuit breaker limits if needed

## Best Practices

1. **Index per use case**: Products and restaurants in separate indices
2. **Keyword vs Text**: Use keyword for exact matching, text for search
3. **Boost fields**: More important fields get higher boost multiplier
4. **Filter before search**: Use bool queries with filters for efficiency
5. **Monitor growth**: Set up alerts for index size and document count
