class World {
  constructor(seed = null) {
    this.seed = seed || Date.now();
    this.generator = new WorldGenerator(this.seed);
    this.chunks = new Map();
    this.viewDistance = 4;
  }

  getChunk(chunkX) {
    if (chunkX < 0 || chunkX >= WORLD_WIDTH_CHUNKS) return null;
    if (!this.chunks.has(chunkX)) {
      const blocks = this.generator.generateChunk(chunkX);
      const chunk = new Chunk(chunkX, blocks);
      this.chunks.set(chunkX, chunk);
    }
    return this.chunks.get(chunkX);
  }

  getBlock(worldX, worldY) {
    if (worldX < 0 || worldX >= WORLD_WIDTH || worldY < 0 || worldY >= WORLD_HEIGHT) {
      return BlockType.AIR;
    }
    const chunkX = Math.floor(worldX / CHUNK_WIDTH);
    const localX = worldX % CHUNK_WIDTH;
    const chunk = this.getChunk(chunkX);
    if (!chunk) return BlockType.AIR;
    return chunk.getBlock(localX, worldY);
  }

  setBlock(worldX, worldY, blockType) {
    if (worldX < 0 || worldX >= WORLD_WIDTH || worldY < 0 || worldY >= WORLD_HEIGHT) {
      return false;
    }
    const chunkX = Math.floor(worldX / CHUNK_WIDTH);
    const localX = worldX % CHUNK_WIDTH;
    const chunk = this.getChunk(chunkX);
    if (!chunk) return false;
    return chunk.setBlock(localX, worldY, blockType);
  }

  isSolid(worldX, worldY) {
    const block = this.getBlock(worldX, worldY);
    const props = BlockProperties[block];
    return props ? props.solid : false;
  }

  getSpawnPosition() {
    return this.generator.generateSpawnPosition();
  }

  updateChunks(playerX) {
    const playerChunkX = Math.floor(playerX / (CHUNK_WIDTH * TILE_SIZE));
    const minChunk = Math.max(0, playerChunkX - this.viewDistance);
    const maxChunk = Math.min(WORLD_WIDTH_CHUNKS - 1, playerChunkX + this.viewDistance);

    const chunksToRemove = [];
    for (const [chunkX, chunk] of this.chunks) {
      if (chunkX < minChunk - 1 || chunkX > maxChunk + 1) {
        chunksToRemove.push(chunkX);
      }
    }

    for (const chunkX of chunksToRemove) {
      this.chunks.delete(chunkX);
    }

    for (let cx = minChunk; cx <= maxChunk; cx++) {
      this.getChunk(cx);
    }
  }

  getVisibleChunks(startX, endX) {
    const startChunk = Math.floor(startX / CHUNK_WIDTH);
    const endChunk = Math.floor(endX / CHUNK_WIDTH);
    const visible = [];
    for (let cx = startChunk; cx <= endChunk; cx++) {
      if (cx >= 0 && cx < WORLD_WIDTH_CHUNKS) {
        const chunk = this.getChunk(cx);
        if (chunk) visible.push(chunk);
      }
    }
    return visible;
  }

  findSurfaceY(worldX) {
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      if (this.isSolid(worldX, y)) {
        return y - 1;
      }
    }
    return WORLD_HEIGHT - 10;
  }

  serialize() {
    const chunksData = {};
    for (const [key, chunk] of this.chunks) {
      if (chunk.modified) {
        chunksData[key] = chunk.serialize();
      }
    }
    return {
      seed: this.seed,
      chunks: chunksData,
    };
  }

  static deserialize(data) {
    const world = new World(data.seed);
    if (data.chunks) {
      for (const [key, chunkData] of Object.entries(data.chunks)) {
        const chunk = Chunk.deserialize(chunkData);
        world.chunks.set(parseInt(key), chunk);
      }
    }
    return world;
  }
}
