import Config from '~/src/common/config';

export const SLOT_SIZES = {
  extraSmall: 32,
  small: 48,
  medium: 64,
  large: 72,
  extraLarge: 96,
};
export const SLOT_SIZE = SLOT_SIZES[Config.Inventory_SlotSize as keyof typeof SLOT_SIZES] || 48;
export const SLOT_GAP = 1;
