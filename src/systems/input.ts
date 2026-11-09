import Phaser from 'phaser';

export type Dir = 'down' | 'up' | 'left' | 'right';

/**
 * Keyboard movement: arrow keys and WASD. Returns a normalised vector each
 * frame plus the facing direction. Touch controls come later (plan: desktop first).
 */
export class MoveInput {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  readonly vec = new Phaser.Math.Vector2();
  facing: Dir = 'down';

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = kb.addKeys('W,A,S,D') as typeof this.wasd;
  }

  update(): void {
    const left = this.cursors.left.isDown || this.wasd.A.isDown;
    const right = this.cursors.right.isDown || this.wasd.D.isDown;
    const up = this.cursors.up.isDown || this.wasd.W.isDown;
    const down = this.cursors.down.isDown || this.wasd.S.isDown;
    this.vec.set((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0));
    if (this.vec.lengthSq() > 0) {
      this.vec.normalize();
      // Prefer horizontal facing when moving diagonally; feels right top-down.
      if (Math.abs(this.vec.x) >= Math.abs(this.vec.y)) this.facing = this.vec.x > 0 ? 'right' : 'left';
      else this.facing = this.vec.y > 0 ? 'down' : 'up';
    }
  }

  get moving(): boolean {
    return this.vec.lengthSq() > 0;
  }
}
