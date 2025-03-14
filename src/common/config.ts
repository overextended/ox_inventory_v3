import type StaticConfig from '~/static/config.json';
import { LoadJsonFile } from './utils';

// https://www.raygesualdo.com/posts/flattening-object-keys-with-typescript-types/
type FlattenObjectKeys<T extends Record<string, any>, Key = keyof T> = Key extends string
  ? T[Key] extends any[]
    ? Key
    : T[Key] extends Record<string, any>
      ? `${Key}_${FlattenObjectKeys<T[Key]>}`
      : Key
  : never;

type FlattenObject<T extends Record<string, any>> = {
  [K in FlattenObjectKeys<T>]: K extends `${infer Parent}_${infer Child}`
    ? Child extends FlattenObjectKeys<T[Extract<keyof T, Parent>]>
      ? FlattenObject<T[Extract<keyof T, Parent>]>[Child]
      : never
    : T[Extract<keyof T, K>];
};

export function FlattenDict<T extends Record<string, any>>(
  source: T,
  target = {} as any,
  prefix?: string,
): FlattenObject<T> {
  for (const key in source) {
    const fullKey = prefix ? `${prefix}_${key}` : key;
    const value = source[key];

    value && typeof value === 'object' && !Array.isArray(value)
      ? FlattenDict(value, target, fullKey)
      : (target[fullKey] = value);
  }

  return target;
}

let config = LoadJsonFile('static/config.json');

$BROWSER: {
  config = await config;
}

export default FlattenDict(config as typeof StaticConfig);
