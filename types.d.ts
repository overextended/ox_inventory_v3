declare interface MoveItem {
  fromType: string;
  toType: string;
  fromId: string;
  toId?: string;
  fromSlot: number;
  toSlot?: number;
  quantity: number;
  rotate: boolean;
  coords?: [number, number, number];
}

declare type NuiCb = (value: unknown) => void;

type ClassProperties<C> = {  
  [Key in keyof C as C[Key] extends Function ? never : Key]: C[Key]
}
