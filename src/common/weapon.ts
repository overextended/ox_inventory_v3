import { LoadJsonFile } from './utils';

const components = LoadJsonFile<{ [key: string]: string[] }>('static/components.json');

export function GetWeaponAttachment(name: string) {
  return components[name];
}
