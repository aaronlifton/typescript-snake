import { Block, Position } from "./types";

class Sprite {
  defaultColor = "black"

  constructor(
    public blocks: Block[] = []
  ) {}

  get color() {
    return this.defaultColor
  }

  buildBlock(
    x: number,
    y: number,
    color: string = this.color
  ): Block {
    return {
      position: { x, y },
      color: color
    };
  }

  detectCollisionAtPosition(position: Position): boolean {
    for (let i = 0; i < this.blocks.length; i++) {
      if (
        this.blocks[i].position.x == position.x &&
        this.blocks[i].position.y == position.y
      ) {
        return true;
      }
    }
    return false;
  }

  detectCollisionWithSprite(sprite: Sprite): boolean {
    for (let i = 0; i < this.blocks.length; i++) {
      for (let j = 0; j < sprite.blocks.length; j++) {
        if (
          this.blocks[i].position.x == sprite.blocks[j].position.x &&
          this.blocks[i].position.y == sprite.blocks[j].position.y
        ) {
          return true;
        }
      }
    }
    return false;
  }

  detectCollisionWithBlock(block: Block): boolean {
    for (let i = 0; i < this.blocks.length; i++) {
      if (
        this.blocks[i].position.x == block.position.x &&
        this.blocks[i].position.y == block.position.y
      ) {
        return true;
      }
    }
    return false;
  }
}

export class SingularSprite extends Sprite {
  constructor(position: Position) {
    super()
    this.blocks.push(
      this.buildBlock(position.x, position.y)
    );
  }

  get block() {
    return this.blocks[0];
  }
}

export default Sprite;
