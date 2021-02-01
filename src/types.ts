interface Position {
  x: number;
  y: number;
}

interface Block {
  position: Position;
  color?: string;
  gradient?: CanvasGradient;
}

export {
  Position,
  Block
}