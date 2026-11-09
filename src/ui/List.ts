import Phaser from 'phaser';

export interface ListItem {
  label: string;
  dim?: boolean;
}

/** Vertical keyboard list: Up/Down moves, caller reads .index. Renders plain text rows. */
export class List {
  private texts: Phaser.GameObjects.Text[] = [];
  index = 0;
  items: ListItem[] = [];

  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private rowH: number;
  private fontSize: string;
  private width?: number;

  constructor(scene: Phaser.Scene, x: number, y: number, rowH = 11, fontSize = '9px', width?: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.rowH = rowH;
    this.fontSize = fontSize;
    this.width = width;
  }

  setItems(items: ListItem[], keepIndex = false): void {
    this.items = items;
    if (!keepIndex || this.index >= items.length) this.index = 0;
    for (const t of this.texts) t.destroy();
    this.texts = items.map((_it, i) =>
      this.scene.add.text(this.x, this.y + i * this.rowH, '', {
        fontFamily: 'monospace',
        fontSize: this.fontSize,
        color: '#f4f1e8',
        wordWrap: this.width ? { width: this.width } : undefined,
      }),
    );
    this.paint();
  }

  move(delta: number): void {
    if (!this.items.length) return;
    this.index = (this.index + delta + this.items.length) % this.items.length;
    this.paint();
  }

  get selected(): ListItem | undefined {
    return this.items[this.index];
  }

  setVisible(v: boolean): void {
    for (const t of this.texts) t.setVisible(v);
  }

  destroy(): void {
    for (const t of this.texts) t.destroy();
    this.texts = [];
  }

  private paint(): void {
    this.texts.forEach((t, i) => {
      const it = this.items[i];
      const on = i === this.index;
      t.setText((on ? '> ' : '  ') + it.label);
      t.setColor(on ? '#ffd37a' : it.dim ? '#7a8294' : '#f4f1e8');
    });
  }
}
