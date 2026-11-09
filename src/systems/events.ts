import Phaser from 'phaser';

/** One shared event bus for cross-scene messages (HUD toasts, dialogue closed, day changed). */
export const bus = new Phaser.Events.EventEmitter();

export const EV = {
  toast: 'toast',
  dialogueClosed: 'dialogue-closed',
  stateChanged: 'state-changed',
  overlayClosed: 'overlay-closed',
} as const;
