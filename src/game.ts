import Player from "./sprites/Player";
import Apple from "./sprites/Apple";
import Trap from "./sprites/Trap";
import Sprite from "./Sprite";
import { Position, Block } from "./types";
class Game {
  private canvas: HTMLCanvasElement;
  private cellSize = 20;
  private cellsX = 40;
  private cellsY = 40;
  private width = this.cellsX * this.cellSize;
  private height = this.cellsY * this.cellSize;
  private isRunning = true;
  private player: Player;
  private lastTime: number;
  private startTime: number;
  private frameCount = 0;
  private direction: "Up" | "Down" | "Right" | "Left";
  private fps = 20;
  private fpsInterval = 1000 / this.fps;
  private apples: Apple[] = [];
  private numApples = 10;
  private traps: Trap[] = [];
  private numTraps = 5;
  private gameStatus = "running";
  private animationFrameRequestId: number;
  private scale = 1;
  private startOverButton: HTMLButtonElement;
  private gradients: { [key: string]: CanvasGradient };

  constructor() {
    this.setupDimensions();

    this.setupButtons();
    this.startGame();
  }

  startGame() {
    this.lastTime = window.performance.now();
    this.startTime = this.lastTime;

    this.buildGradients();
    this.buildSprites();

    window.addEventListener("keydown", this.onKeyDown.bind(this), false);
    window.requestAnimationFrame(this.runGameLoop.bind(this));

    this.isRunning = true;
  }

  buildSprites() {
    this.setSnakePosition();
    this.setApplePositions();
    this.setTrapPositions();
  }

  setupDimensions() {
    this.canvas = document.createElement("Canvas") as HTMLCanvasElement;
    this.context.lineWidth = 2;
    document.body.append(this.canvas);

    if (this.cellsX * this.cellSize * this.scale + 1 > window.innerHeight) {
      const height = window.innerHeight;
      this.cellSize = height / (this.scale * this.cellsY) - 1;
      this.width = this.cellsX * this.cellSize;
      this.height = this.cellsY * this.cellSize;
    }

    this.canvas.style.width = this.width + "px";
    this.canvas.style.height = this.height + "px";

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  setupButtons() {
    window.addEventListener("load", () => {
      this.startOverButton = document.createElement("button");
      this.startOverButton.innerHTML = "Start Over";
      this.startOverButton.addEventListener(
        "click",
        this.onStartOverClick.bind(this),
      );
      this.toggleStartOverButton(false);
      document.getElementById("controls").appendChild(this.startOverButton);
    });
  }

  onStartOverClick() {
    this.apples = [];
    this.traps = [];
    this.player = null;

    this.buildSprites();
    this.isRunning = true;
    this.gameStatus = "running";
    window.requestAnimationFrame(this.runGameLoop.bind(this));
  }

  toggleStartOverButton(show: boolean) {
    this.startOverButton.style.opacity = show ? "1" : "0";
  }

  onKeyDown(evt: KeyboardEvent) {
    switch (evt.key) {
      case "Escape":
        this.isRunning = false;
        break;
      case "a":
        this.direction = "Left";
        break;
      case "s":
        this.direction = "Down";
        break;
      case "d":
        this.direction = "Right";
        break;
      case "w":
        this.direction = "Up";
        break;
    }
  }

  moveInDirection() {
    switch (this.direction) {
      case "Up":
        this.movePlayer(0, -1);
        break;
      case "Down":
        this.movePlayer(0, 1);
        break;
      case "Left":
        this.movePlayer(-1, 0);
        break;
      case "Right":
        this.movePlayer(1, 0);
        break;
    }
  }

  movePlayer(xOffset: number, yOffset: number) {
    let { x, y } = this.player.positionWithOffset(xOffset, yOffset);

    if (x < 0) {
      x = this.cellsX - 1;
    } else if (x > this.cellsX - 1) {
      x = 0;
    } else if (y < 0) {
      y = this.cellsY - 1;
    } else if (y > this.cellsY - 1) {
      y = 0;
    }
    if (!this.checkState({ x: x, y: y })) return;

    this.player.moveTo(x, y);
  }

  runGameLoop(newTime?: number) {
    if (!this.isRunning) {
      this.toggleStartOverButton(true);
      return;
    }

    this.animationFrameRequestId = window.requestAnimationFrame(
      this.runGameLoop.bind(this),
    );

    const now = newTime;
    const timeElapsed = now - this.lastTime;

    if (timeElapsed > this.fpsInterval) {
      this.lastTime = now - (timeElapsed % this.fpsInterval);
      const timeSinceStart = now - this.startTime;

      this.moveInDirection();
      this.paint();
      this.drawFPS(timeSinceStart);
      this.showGameMessage();
    }
  }

  checkState(position: Position): boolean {
    const { x, y } = position;

    if (this.playerIsCollidedWithTrap({ x, y })) {
      this.lostGame();
      return false;
    }

    let collidedApple = this.playerIsCollidedWithApple({ x, y });
    if (collidedApple) {
      const idx = this.apples.indexOf(collidedApple);
      this.player.eat(collidedApple.block);
      this.apples = [
        ...this.apples.slice(0, idx),
        ...this.apples.slice(idx + 1),
      ];
      return false;
    }

    const collidedWithSelf = this.player.detectCollisionWithSelf(position);
    if (collidedWithSelf) {
      this.lostGame();
      return false;
    }

    if (this.apples.length == 0) {
      this.isRunning = false;
      this.gameStatus = "won";
      window.cancelAnimationFrame(this.animationFrameRequestId);
      return false;
    }

    return true;
  }

  lostGame() {
    this.isRunning = false;
    this.gameStatus = "lost";
    window.cancelAnimationFrame(this.animationFrameRequestId);
  }

  playerIsCollidedWithTrap(position: Position) {
    return this.traps.some((trap) => {
      return trap.detectCollisionAtPosition(position);
    });
  }

  playerIsCollidedWithApple(position: Position) {
    return this.apples.find((apple) => {
      return apple.detectCollisionAtPosition(position);
    });
  }

  get context(): CanvasRenderingContext2D {
    return this.canvas.getContext("2d");
  }

  paint() {
    this.clearScreen();
    this.drawGrid(0, 0, this.width, this.height);
    this.drawSprite(this.player, "snakeGradient");
    this.apples.forEach((apple) => this.drawSprite(apple, "appleGradient"));
    this.traps.forEach((trap) => this.drawSprite(trap, "trapGradient"));
  }

  clearScreen() {
    this.context.fillStyle = "white";
    this.context.clearRect(0, 0, this.width, this.height);
  }

  buildGradients() {
    const appleGradient = this.context.createLinearGradient(
      0,
      0,
      this.width,
      this.height,
    );

    appleGradient.addColorStop(0, "pink");
    appleGradient.addColorStop(0.5, "red");
    appleGradient.addColorStop(1, "crimson");

    const trapGradient = this.context.createLinearGradient(
      0,
      0,
      this.width,
      this.height,
    );

    trapGradient.addColorStop(0, "grey");
    trapGradient.addColorStop(0.5, "darkgrey");
    trapGradient.addColorStop(1, "gainsboro");

    const snakeGradient = this.context.createLinearGradient(
      0,
      0,
      this.width,
      this.height,
    );

    snakeGradient.addColorStop(0, "darkslategrey");
    snakeGradient.addColorStop(0.5, "#333333");
    snakeGradient.addColorStop(1, "black");

    this.gradients = { appleGradient, trapGradient, snakeGradient };
  }

  drawSprite(sprite: Sprite, gradientStyle?: string) {
    sprite.blocks.forEach((block) => {
      this.drawBlock(block, gradientStyle);
    });
  }

  drawBlock(block: Block, gradientStyle?: string) {
    if (gradientStyle) {
      this.context.fillStyle = this.gradients[gradientStyle];
    } else {
      this.context.fillStyle = block.color;
    }
    this.context.fillRect(
      block.position.x * this.cellSize,
      block.position.y * this.cellSize,
      this.cellSize,
      this.cellSize,
    );
  }

  drawGrid(x: number, y: number, width: number, height: number) {
    this.context.strokeStyle = "#CCCCCC";
    for (let x = 0; x <= width; x += this.cellSize) {
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(x, height);
      this.context.stroke();
    }

    for (let y = 0; y <= height; y += this.cellSize) {
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }
  }

  showGameMessage() {
    switch (this.gameStatus) {
      case "lost":
        this.drawTextAtMiddle("Try again");
        break;
      case "won":
        this.drawTextAtMiddle("You won!");
        break;
    }
  }

  drawFPS(timeSinceStart: number) {
    const currentFps =
      Math.round((1000 / (timeSinceStart / ++this.frameCount)) * 100) / 100;
    this.drawTextAtBottomRight(`FPS: ${currentFps.toString()}`);
  }

  drawStrokeText(text: string, x: number, y: number) {
    this.context.strokeStyle = "white";
    const prevLineWidth = this.context.lineWidth;
    this.context.lineWidth = 4;
    this.context.strokeText(text, x, y);
    this.context.fillStyle = "black";
    this.context.fillText(text, x, y);
    this.context.lineWidth = prevLineWidth;
  }

  drawTextAtMiddle(text: string) {
    this.context.font = "36px sans-serif";

    const textMetrics = this.context.measureText(text);
    this.drawStrokeText(
      text,
      this.width / 2 - textMetrics.width / 2,
      this.height / 2 - textMetrics.actualBoundingBoxAscent / 2,
    );
  }

  drawTextAtBottomRight(text: string) {
    this.context.font = "12px sans-serif";

    const textMetrics = this.context.measureText(text);
    this.drawText(text, this.width - textMetrics.width - 1, this.height - 2);
  }

  drawText(text: string, x: number, y: number) {
    this.context.fillStyle = "black";

    this.context.fillText(text, x, y, this.width);
  }

  setSnakePosition() {
    const [middleX, middleY] = [
      Math.floor(this.cellsX / 2),
      Math.floor(this.cellsY / 2),
    ];
    this.player = new Player({ x: middleX, y: middleY }, 6);
  }

  private getRandomXY() {
    return {
      x: Math.floor(Math.random() * this.cellsX),
      y: Math.floor(Math.random() * this.cellsY),
    };
  }

  setApplePositions() {
    for (let i = 0; i < this.numApples; i++) {
      let apple: Apple;
      while (!apple || apple.detectCollisionWithSprite(this.player)) {
        const { x, y } = this.getRandomXY();
        apple = new Apple({ x, y });
      }
      this.apples.push(apple);
    }
  }

  setTrapPositions() {
    for (let i = 0; i < this.numTraps; i++) {
      let trap: Trap;
      while (
        !trap ||
        trap.detectCollisionWithSprite(this.player) ||
        this.apples.some((apple) => apple.detectCollisionWithSprite(trap))
      ) {
        const { x, y } = this.getRandomXY();
        trap = new Trap({ x, y });
      }
      this.traps.push(trap);
    }
  }
}

export default Game;
