import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { state } from '../systems/state';
import { bus, EV } from '../systems/events';
import { content } from '../content';

export interface MapInfo {
  width: number;
  height: number;
  /** Ground tile gid per index (0 = none). */
  ground: number[];
  /** Wall tile gid per index. */
  walls: number[];
  player: { x: number; y: number };
  markers: { x: number; y: number; kind: 'ship' | 'scan' | 'npc'; id: string }[];
}

/** Colours for the paper map, by ground gid. Unknown gids fall back to parchment. */
const GID_COLOR: Record<number, number> = {
  1: 0x9db37a, 2: 0xa6b97e, 3: 0xb7a98f, 4: 0x6fa8c9, 5: 0x6b6f78, 6: 0x6b6f78, 7: 0x4d4e55,
  9: 0x6f8f55, 10: 0x7fa05d, 11: 0xe6edf0, 12: 0x9cc6da, 13: 0x6f8f55, 14: 0x7fa05d, 15: 0x1c2a3a, 16: 0x9fd0e3, 17: 0xa7b08a,
};

/**
 * The paper map (M). Shows only explored tiles, a compass rose, grid references
 * (letters across, numbers down, 5x5 tiles per cell), the ship, scanned places, people,
 * and you. Explored percentage is the only number shown.
 */
export class MapScene extends Phaser.Scene {
  private info!: MapInfo;

  constructor() {
    super('Map');
  }

  init(data: { info: MapInfo }): void {
    this.info = data.info;
  }

  create(): void {
    const { width: W, height: H, ground, walls, player, markers } = this.info;
    const cell = 5; // tiles per grid cell
    const scale = Math.floor(Math.min((GAME_WIDTH - 120) / W, (GAME_HEIGHT - 60) / H)); // px per tile
    const mapW = W * scale;
    const mapH = H * scale;
    const ox = 60;
    const oy = 36;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0b0d14, 0.85);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH - 24, GAME_HEIGHT - 16, 0xf1e9d2).setStrokeStyle(2, 0x8a7a5a);
    this.add.text(ox, 16, 'MAP  ·  Iceland, the south coast', { fontFamily: 'monospace', fontSize: '9px', color: '#5a4a2a' });

    const g = this.add.graphics();
    let explored = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const known = state.isExplored(i);
        if (known) explored++;
        let color = 0xd9ccae; // unexplored parchment
        if (known) {
          color = walls[i] ? 0x3a3d44 : (GID_COLOR[ground[i]] ?? 0xd9ccae);
        }
        g.fillStyle(color, 1);
        g.fillRect(ox + x * scale, oy + y * scale, scale, scale);
      }
    }
    // Grid lines and references
    g.lineStyle(1, 0x8a7a5a, 0.5);
    for (let x = 0; x <= W; x += cell) g.lineBetween(ox + x * scale, oy, ox + x * scale, oy + mapH);
    for (let y = 0; y <= H; y += cell) g.lineBetween(ox, oy + y * scale, ox + mapW, oy + y * scale);
    for (let x = 0; x < W; x += cell) {
      this.add.text(ox + (x + cell / 2) * scale, oy - 8, String.fromCharCode(65 + x / cell), { fontFamily: 'monospace', fontSize: '7px', color: '#5a4a2a' }).setOrigin(0.5);
    }
    for (let y = 0; y < H; y += cell) {
      this.add.text(ox - 8, oy + (y + cell / 2) * scale, String(y / cell + 1), { fontFamily: 'monospace', fontSize: '7px', color: '#5a4a2a' }).setOrigin(0.5);
    }

    // Markers (only on explored tiles)
    const toPx = (wx: number, wy: number) => ({ x: ox + (wx / 16) * scale, y: oy + (wy / 16) * scale });
    for (const m of markers) {
      const tx = Math.floor(m.x / 16);
      const ty = Math.floor(m.y / 16);
      if (!state.isExplored(ty * W + tx)) continue;
      const p = toPx(m.x, m.y);
      const color = m.kind === 'ship' ? 0x8e6bbf : m.kind === 'npc' ? 0xb5451b : 0x2b6cb0;
      this.add.rectangle(p.x, p.y, 4, 4, color).setStrokeStyle(1, 0x1a1c20);
      const label = m.kind === 'ship' ? 'ship' : m.kind === 'npc' ? content.npcs[m.id]?.name ?? m.id : content.scannables[m.id]?.name ?? m.id;
      if (m.kind !== 'scan' || state.hasScanned(m.id)) this.add.text(p.x + 4, p.y - 3, label, { fontFamily: 'monospace', fontSize: '6px', color: '#2b2418' });
    }
    const pp = toPx(player.x, player.y);
    const you = this.add.rectangle(pp.x, pp.y, 5, 5, 0xffd37a).setStrokeStyle(1, 0x1a1c20);
    this.tweens.add({ targets: you, alpha: 0.3, duration: 400, yoyo: true, repeat: -1 });
    const col = String.fromCharCode(65 + Math.floor(player.x / 16 / cell));
    const row = Math.floor(player.y / 16 / cell) + 1;

    // Compass rose
    const cxr = GAME_WIDTH - 50;
    const cyr = 60;
    g.lineStyle(1, 0x5a4a2a, 1);
    g.strokeCircle(cxr, cyr, 14);
    g.fillStyle(0xb5451b, 1);
    g.fillTriangle(cxr, cyr - 14, cxr - 4, cyr, cxr + 4, cyr);
    g.fillStyle(0x5a4a2a, 1);
    g.fillTriangle(cxr, cyr + 14, cxr - 4, cyr, cxr + 4, cyr);
    this.add.text(cxr, cyr - 22, 'N', { fontFamily: 'monospace', fontSize: '8px', color: '#b5451b' }).setOrigin(0.5);

    const pct = Math.round((explored / (W * H)) * 100);
    this.add.text(GAME_WIDTH - 24, GAME_HEIGHT - 44, [`You: ${col}${row}`, `Explored: ${pct}%`], { fontFamily: 'monospace', fontSize: '8px', color: '#5a4a2a', align: 'right' }).setOrigin(1, 1);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 14, 'Esc or M: close', { fontFamily: 'monospace', fontSize: '7px', color: '#9aa3b2' }).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-ESC', this.close, this);
    kb.on('keydown-M', this.close, this);
    (window as unknown as { __debug: Record<string, unknown> }).__debug.map = { explored: pct, you: `${col}${row}` };
  }

  private close(): void {
    (window as unknown as { __debug: Record<string, unknown> }).__debug.map = null;
    bus.emit(EV.overlayClosed);
    this.scene.stop();
  }
}
