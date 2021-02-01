import { Block, Position } from "../types";
import Sprite from "../Sprite";

class Player extends Sprite {
  constructor(startPosition: Position, numBlocks: number) {
    super();
    for (let i = 0; i < numBlocks; i++) {
      const newPosition = {
        x: startPosition.x + i,
        y: startPosition.y + i,
      };
      this.blocks.push(
        this.buildBlock(newPosition.x, newPosition.y, this.color),
      );
    }
  }

  eat(block: Block) {
    this.blocks.push({
      ...block,
      color: this.color,
    });
  }

  move(xOffset: number, yOffset: number) {
    const newPosition = {
      x: this.headBlock.position.x + xOffset,
      y: this.headBlock.position.y + yOffset,
    };
    this.blocks = [
      ...this.blocks.slice(1),
      this.buildBlock(newPosition.x, newPosition.y, this.color),
    ];
  }

  moveTo(x: number, y: number) {
    this.blocks = [...this.blocks.slice(1), this.buildBlock(x, y, this.color)];
  }

  detectCollisionWithSelf(position: Position) {
    return this.blocks.slice(1).some((block) => {
      return block.position.x == position.x && block.position.y == position.y;
    });
  }

  positionWithOffset(xOffset: number, yOffset: number) {
    return {
      x: this.headBlock.position.x + xOffset,
      y: this.headBlock.position.y + yOffset,
    };
  }

  get headBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }
}

export default Player;
