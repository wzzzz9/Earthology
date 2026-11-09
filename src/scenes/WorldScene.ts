import Phaser from 'phaser';
import { makePlaceholderTileset, makePlaceholderPlayer, PLAYER_W, PLAYER_H } from '../systems/placeholders';
import { MoveInput } from '../systems/input';

const SPEED = 70; // px per second, a relaxed walking pace for 16px tiles

/** The current region map with the player. M2: walk around with collisions. */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private move!: MoveInput;

  constructor() {
    super('World');
  }

  create(): void {
    makePlaceholderTileset(this);
    makePlaceholderPlayer(this);

    const map = this.make.tilemap({ key: 'map.test-field' });
    const tileset = map.addTilesetImage('placeholder', 'placeholder')!;
    const ground = map.createLayer('ground', tileset)!;
    const walls = map.createLayer('walls', tileset)!;
    ground.setCollisionByProperty({ collides: true });
    walls.setCollisionByProperty({ collides: true });

    const spawn = map.findObject('objects', (o) => o.name === 'spawn');
    const sx = spawn?.x ?? map.widthInPixels / 2;
    const sy = spawn?.y ?? map.heightInPixels / 2;

    this.player = this.physics.add.sprite(sx, sy, 'player', 'down0');
    // Collide with the feet only, so the head can overlap a rock above.
    this.player.body!.setSize(10, 8).setOffset((PLAYER_W - 10) / 2, PLAYER_H - 8);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.add.collider(this.player, ground);
    this.physics.add.collider(this.player, walls);

    for (const dir of ['down', 'up', 'left', 'right'] as const) {
      this.anims.create({
        key: `walk-${dir}`,
        frames: [{ key: 'player', frame: `${dir}0` }, { key: 'player', frame: `${dir}1` }],
        frameRate: 6,
        repeat: -1,
      });
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setRoundPixels(true);

    this.move = new MoveInput(this);

    // Debug hook read by scripts/shot.mjs so headless checks can confirm movement.
    const player = this.player;
    (window as unknown as { __debug: unknown }).__debug = {
      get player() {
        return { x: Math.round(player.x), y: Math.round(player.y) };
      },
    };
  }

  update(): void {
    this.move.update();
    this.player.setVelocity(this.move.vec.x * SPEED, this.move.vec.y * SPEED);
    if (this.move.moving) {
      this.player.anims.play(`walk-${this.move.facing}`, true);
    } else {
      this.player.anims.stop();
      this.player.setFrame(`${this.move.facing}0`);
    }
  }
}
