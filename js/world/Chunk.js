class Chunk {
  constructor(x, blocks = null) {
    this.x = x;
    this.width = CHUNK_WIDTH;
    this.height = CHUNK_HEIGHT;
    this.blocks = blocks || new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT);
    this.modified = false;
    this.dirty = true;
  }

  getBlock(localX, localY) {
    if (localX < 0 || localX >= this.width || localY < 0 || localY >= this.height) {
      return BlockType.AIR;
    }
    return this.blocks[localY * this.width + localX];
  }

  setBlock(localX, localY, blockType) {
    if (localX < 0 || localX >= this.width || localY < 0 || localY >= this.height) {
      return false;
    }
    this.blocks[localY * this.width + localX] = blockType;
    this.modified = true;
    this.dirty = true;
    return true;
  }

  isSolid(localX, localY) {
    const block = this.getBlock(localX, localY);
    const props = BlockProperties[block];
    return props ? props.solid : false;
  }

  serialize() {
    return {
      x: this.x,
      blocks: Array.from(this.blocks),
      modified: this.modified,
    };
  }

  static deserialize(data) {
    const chunk = new Chunk(data.x, new Uint8Array(data.blocks));
    chunk.modified = data.modified || false;
    return chunk;
  }
}
