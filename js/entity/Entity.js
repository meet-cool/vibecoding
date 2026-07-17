class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = width;
    this.height = height;
    this.onGround = false;
    this.facing = 1;
    this.health = 20;
    this.maxHealth = 20;
    this.dead = false;
    this.type = 'entity';
    this.id = Math.random().toString(36).substr(2, 9);
  }

  update(dt, world, physics) {
    physics.updateEntity(this, dt);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
    }
  }

  getBounds() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height,
      width: this.width,
      height: this.height,
    };
  }

  serialize() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      health: this.health,
      maxHealth: this.maxHealth,
      facing: this.facing,
    };
  }

  static deserialize(data) {
    const entity = new Entity(data.x, data.y, 0, 0);
    Object.assign(entity, data);
    return entity;
  }
}
