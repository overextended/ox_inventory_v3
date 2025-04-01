type Vector = { x: number; y: number; [key: string]: any };

export interface GridEntry {
  coords: Vector;
  length?: number;
  width?: number;
  radius?: number;
  [key: string]: any;
}

type GridEntryFilter<T extends GridEntry> = (entry: T) => boolean;

interface GridCache<T extends GridEntry> {
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  lastX?: number;
  lastY?: number;
  filter?: GridEntryFilter<T>;
  entries?: T[];
  lastCell?: Set<T>;
}

export class Grid<T extends GridEntry> {
  private cache: GridCache<T> = {};
  private grid: Map<number, Map<number, Set<T>>> = new Map();
  private entries: Map<keyof T, T> = new Map();

  constructor(
    private readonly cellWidth: number = 64,
    private readonly cellHeight = cellWidth,
  ) {}

  private getDimensions(point: Vector, length: number, width: number) {
    const halfWidth = width / 2;
    const halfLength = length / 2;
    const minX = Math.floor((point.x - halfWidth) / this.cellWidth);
    const maxX = Math.floor((point.x + halfWidth) / this.cellWidth);
    const minY = Math.floor((point.y - halfLength) / this.cellHeight);
    const maxY = Math.floor((point.y + halfLength) / this.cellHeight);

    return [minX, maxX, minY, maxY];
  }

  public getCellPosition(point: Vector) {
    const x = Math.floor(point.x / this.cellWidth);
    const y = Math.floor(point.y / this.cellHeight);

    return [x, y];
  }

  public getCell(point: Vector): T[] {
    const [x, y] = this.getCellPosition(point);

    if (this.cache.lastX !== x || this.cache.lastY !== y) {
      this.cache.lastX = x;
      this.cache.lastY = y;

      const row = this.grid.get(y);
      this.cache.lastCell = row?.get(x) ?? new Set();
    }

    return Array.from(this.cache.lastCell ?? []);
  }

  public getNearbyEntries(point: Vector, filter?: GridEntryFilter<T>): T[] {
    const [minX, maxX, minY, maxY] = this.getDimensions(point, this.cellHeight, this.cellWidth);

    if (
      this.cache.filter === filter &&
      this.cache.minX === minX &&
      this.cache.maxX === maxX &&
      this.cache.minY === minY &&
      this.cache.maxY === maxY
    ) {
      return this.cache.entries ?? [];
    }

    const entries = new Set<T>();

    for (let yIndex = minY; yIndex <= maxY; yIndex++) {
      const row = this.grid.get(yIndex);
      if (!row) continue;

      for (let xIndex = minX; xIndex <= maxX; xIndex++) {
        const cell = row.get(xIndex);
        if (!cell) continue;

        for (const entry of cell) {
          if (!entries.has(entry) && (!filter || filter(entry))) {
            entries.add(entry);
          }
        }
      }
    }

    this.cache.minX = minX;
    this.cache.maxX = maxX;
    this.cache.minY = minY;
    this.cache.maxY = maxY;
    this.cache.filter = filter;
    this.cache.entries = Array.from(entries);

    return this.cache.entries;
  }

  public getEntry(entryId: string | number) {
    return this.entries.get(entryId);
  }

  public addEntry(entry: T, identifier: keyof T): void {
    if (!entry[identifier])
      throw new Error(`Attempted to add new Grid Entry with invalid identifier '${identifier as string}'`);

    entry.length ??= entry.radius ? entry.radius * 2 : 0;
    entry.width ??= entry.radius ? entry.radius * 2 : 0;

    const [minX, maxX, minY, maxY] = this.getDimensions(entry.coords, entry.length, entry.width);

    for (let yIndex = minY; yIndex <= maxY; yIndex++) {
      if (!this.grid.has(yIndex)) {
        this.grid.set(yIndex, new Map());
      }

      const row = this.grid.get(yIndex)!;

      for (let xIndex = minX; xIndex <= maxX; xIndex++) {
        if (!row.has(xIndex)) row.set(xIndex, new Set());

        row.get(xIndex)!.add(entry);
      }
    }

    this.cache = {};
    this.entries.set(entry[identifier], entry);
  }

  public removeEntry(entry: T, identifier: keyof T): boolean {
    const [minX, maxX, minY, maxY] = this.getDimensions(entry.coords, entry.length ?? 0, entry.width ?? 0);

    let success = false;

    for (let yIndex = minY; yIndex <= maxY; yIndex++) {
      const row = this.grid.get(yIndex);

      if (!row) continue;

      for (let xIndex = minX; xIndex <= maxX; xIndex++) {
        const cell = row.get(xIndex);

        if (!cell) continue;

        if (cell.delete(entry)) success = true;

        if (cell.size === 0) row.delete(xIndex);
      }

      if (row.size === 0) this.grid.delete(yIndex);
    }

    this.cache = {};
    this.entries.delete(identifier);

    return success;
  }
}
