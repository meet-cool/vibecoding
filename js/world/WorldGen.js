class WorldGenerator {
  constructor(seed) {
    this.seed = seed || Date.now();
    this.noise = new SimplexNoise(this.seed);
    this.caveNoise = new SimplexNoise(this.seed + 1000);
  }

  getHeight(x) {
    const baseHeight = 50;
    const noise1 = this.noise.fbm(x * 0.015, 0, 3, 0.5, 2) * 12;
    const noise2 = this.noise.fbm(x * 0.04, 100, 2, 0.5, 2) * 4;
    const noise3 = this.noise.fbm(x * 0.005, 200, 2, 0.5, 2) * 18;
    return Math.floor(baseHeight + noise1 + noise2 + noise3);
  }

  getBiome(x) {
    const temp = this.noise.fbm(x * 0.01, 500, 2);
    if (temp < -0.3) return 'desert';
    if (temp > 0.3) return 'forest';
    return 'plains';
  }

  generateChunk(chunkX) {
    const blocks = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT);
    const startX = chunkX * CHUNK_WIDTH;

    for (let x = 0; x < CHUNK_WIDTH; x++) {
      const worldX = startX + x;
      const height = this.getHeight(worldX);
      const biome = this.getBiome(worldX);

      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        let blockType = BlockType.AIR;

        if (y >= CHUNK_HEIGHT - 1) {
          blockType = BlockType.BEDROCK;
        } else if (y >= CHUNK_HEIGHT - 4) {
          blockType = BlockType.STONE;
        } else if (y > height + 4) {
          const caveVal = this.caveNoise.fbm(worldX * 0.05, y * 0.05, 3);
          if (caveVal > 0.55 && y < CHUNK_HEIGHT - 10) {
            blockType = BlockType.AIR;
          } else {
            blockType = BlockType.STONE;

            if (y > height + 5 && y < CHUNK_HEIGHT - 10) {
              const coalVal = this.noise.fbm(worldX * 0.15, y * 0.15 + 300, 2);
              if (coalVal > 0.75) {
                blockType = BlockType.COAL_ORE;
              }
            }

            if (y > height + 20 && y < CHUNK_HEIGHT - 10) {
              const ironVal = this.noise.fbm(worldX * 0.12, y * 0.12 + 400, 2);
              if (ironVal > 0.8) {
                blockType = BlockType.IRON_ORE;
              }
            }
          }
        } else if (y > height && y <= height + 4) {
          if (biome === 'desert') {
            if (y <= height + 3) {
              blockType = BlockType.SAND;
            } else {
              blockType = BlockType.STONE;
            }
          } else {
            blockType = BlockType.DIRT;
          }
        } else if (y === height) {
          if (biome === 'desert') {
            blockType = BlockType.SAND;
          } else {
            blockType = BlockType.GRASS;
          }
        }

        if (biome !== 'desert' && height > 60) {
          const waterLevel = 62;
          if (y < height && y >= waterLevel) {
            blockType = BlockType.WATER;
          }
        }

        blocks[y * CHUNK_WIDTH + x] = blockType;
      }

      if (biome === 'forest') {
        const treeChance = this.noise.noise2D(worldX * 0.3, 600);
        if (treeChance > 0.6 && worldX % 5 === 0) {
          this.placeTree(blocks, x, height);
        }
      } else if (biome === 'plains') {
        const treeChance = this.noise.noise2D(worldX * 0.25, 700);
        if (treeChance > 0.75 && worldX % 7 === 0) {
          this.placeTree(blocks, x, height);
        }
      }
    }

    return blocks;
  }

  placeTree(blocks, localX, groundY) {
    if (groundY < 10) return;

    const treeHeight = 4 + Math.floor(Math.abs(this.noise.noise2D(localX * 10, groundY)) * 3);

    for (let i = 1; i <= treeHeight; i++) {
      const y = groundY - i;
      if (y >= 0 && y < CHUNK_HEIGHT) {
        blocks[y * CHUNK_WIDTH + localX] = BlockType.WOOD;
      }
    }

    const leafStart = groundY - treeHeight - 2;
    const leafEnd = groundY - treeHeight + 1;

    for (let y = leafStart; y <= leafEnd; y++) {
      if (y < 0 || y >= CHUNK_HEIGHT) continue;
      for (let dx = -2; dx <= 2; dx++) {
        const lx = localX + dx;
        if (lx < 0 || lx >= CHUNK_WIDTH) continue;
        if (Math.abs(dx) === 2 && (y === leafStart || y === leafEnd)) continue;
        if (blocks[y * CHUNK_WIDTH + lx] === BlockType.AIR) {
          blocks[y * CHUNK_WIDTH + lx] = BlockType.LEAVES;
        }
      }
    }
  }

  generateSpawnPosition() {
    const spawnX = Math.floor(WORLD_WIDTH / 2);
    const height = this.getHeight(spawnX);
    const spawnY = height - 1;
    return { x: spawnX * TILE_SIZE, y: spawnY * TILE_SIZE };
  }
}
