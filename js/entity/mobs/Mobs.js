class Sheep extends Mob {
  constructor(x, y) {
    super(x, y, 24, 32);
    this.mobType = 'sheep';
    this.health = 10;
    this.maxHealth = 10;
    this.speed = 60;
    this.drops = [ItemType.WOOL, ItemType.MUTTON];
    this.color = '#FAFAFA';
    this.grazingTimer = 0;
    this.isGrazing = false;
  }

  updateAI(dt, world, physics, player) {
    const dist = this.getDistanceToPlayer(player);

    if (dist < 80) {
      this.state = 'escape';
      this.moveDir = player.x > this.x ? -1 : 1;
      this.speed = 120;
      this.stateTimer = 1.5;
      this.isGrazing = false;
    } else if (this.state === 'escape') {
      if (this.stateTimer <= 0 || dist > 200) {
        this.state = 'idle';
        this.speed = 60;
        this.moveDir = 0;
      }
    } else {
      if (this.isGrazing) {
        this.grazingTimer -= dt;
        this.moveDir = 0;
        if (this.grazingTimer <= 0) {
          this.isGrazing = false;
          this.stateTimer = 1 + Math.random() * 2;
        }
      } else {
        if (this.stateTimer <= 0) {
          if (Math.random() < 0.3 && this.onGround) {
            this.isGrazing = true;
            this.grazingTimer = 1.5 + Math.random() * 2;
          } else {
            this.moveRandomly();
          }
        } else {
          this.moveRandomly();
        }
      }
    }
  }

  getDropItems() {
    const drops = [];
    drops.push({ type: ItemType.WOOL, count: 1 });
    if (Math.random() < 0.7) {
      drops.push({ type: ItemType.MUTTON, count: 1 + Math.floor(Math.random() * 2) });
    }
    return drops;
  }
}

class Pig extends Mob {
  constructor(x, y) {
    super(x, y, 28, 28);
    this.mobType = 'pig';
    this.health = 10;
    this.maxHealth = 10;
    this.speed = 90;
    this.drops = [ItemType.PORKCHOP];
    this.color = '#F48FB1';
  }

  updateAI(dt, world, physics, player) {
    const dist = this.getDistanceToPlayer(player);

    if (dist < 70) {
      this.state = 'escape';
      this.moveDir = player.x > this.x ? -1 : 1;
      this.speed = 150;
      this.stateTimer = 1;
    } else if (this.state === 'escape') {
      if (this.stateTimer <= 0 || dist > 180) {
        this.state = 'idle';
        this.speed = 90;
        this.moveDir = 0;
      }
    } else {
      this.moveRandomly();
    }
  }

  getDropItems() {
    return [{ type: ItemType.PORKCHOP, count: 1 + Math.floor(Math.random() * 2) }];
  }
}

class Zombie extends Mob {
  constructor(x, y) {
    super(x, y, 22, 46);
    this.mobType = 'zombie';
    this.health = 20;
    this.maxHealth = 20;
    this.speed = 70;
    this.damage = 3;
    this.detectRange = 250;
    this.attackRange = 40;
    this.color = '#558B2F';
    this.hostile = true;
  }

  updateAI(dt, world, physics, player) {
    const dist = this.getDistanceToPlayer(player);

    if (dist < this.detectRange) {
      this.state = 'chase';
      this.facePlayer(player);
      this.moveDir = player.x > this.x ? 1 : -1;

      if (dist < this.attackRange && this.attackCooldown <= 0) {
        if (this.canReachPlayer(player)) {
          player.takeDamage(this.damage);
          this.attackCooldown = 1;
          const kbDir = player.x > this.x ? 1 : -1;
          player.vx = kbDir * 150;
          player.vy = -150;
        }
      }
    } else {
      this.state = 'idle';
      this.moveRandomly();
    }
  }

  canReachPlayer(player) {
    const dy = Math.abs(this.y - player.y);
    return dy < 50;
  }

  getDropItems() {
    const drops = [];
    if (Math.random() < 0.5) {
      drops.push({ type: ItemType.COAL, count: 1 });
    }
    return drops;
  }
}
