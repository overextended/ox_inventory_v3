import type { InventoryItem } from '@common/item';

interface TooltipState {
  x: number;
  y: number;
  visible: boolean;
  item: InventoryItem | null;
  close: () => void;
  open: (data: { x: number; y: number; item: InventoryItem }) => void;
}

export const tooltip = $state<TooltipState>({
  x: 0,
  y: 0,
  visible: false,
  item: null,

  open({ x, y, item }) {
    this.visible = true;
    this.x = x;
    this.y = y;
    this.item = item;
  },

  close() {
    this.visible = false;
  },
});
