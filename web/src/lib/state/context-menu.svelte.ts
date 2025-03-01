import type { ContextMenuButtonResponse } from '$lib/actions/openContextMenu';

interface ContextMenuState {
  visible: boolean;
  buttons: ContextMenuButtonResponse[];
  itemId: string;
  x: number;
  y: number;
  open: (data: ContextMenuOpenData) => void;
  close: () => void;
}

interface ContextMenuOpenData {
  x: ContextMenuState['x'];
  y: ContextMenuState['y'];
  buttons: ContextMenuState['buttons'];
  itemId: ContextMenuState['itemId'];
}

export const contextMenu = $state<ContextMenuState>({
  visible: false,
  buttons: [],
  itemId: '',
  x: 0,
  y: 0,

  open({ x, y, buttons, itemId }) {
    this.visible = true;
    this.buttons = buttons;
    this.itemId = itemId;
    this.x = x;
    this.y = y;
  },

  close() {
    this.visible = false;
  },
});
