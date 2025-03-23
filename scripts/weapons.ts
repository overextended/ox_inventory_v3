import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { BaseItem } from '../src/common/item';
import { exists } from './utils.js';

interface Weapon {
  Label: string;
  IntHash: number;
  Category: string;
}

interface Components {
  [Name: string]: string[];
}

interface RawWeapon extends Weapon {
  Name: string;
  TranslatedLabel?: { English: string };
  Components: RawComponent[];
}

interface RawComponent {
  Name: string;
  IsDefault: boolean;
  TranslatedLabel: { Name: string };
}

const invalidWeapons = new Set([
  'WEAPON_PASSENGER_ROCKET',
  'WEAPON_AIRSTRIKE_ROCKET',
  'WEAPON_STINGER',
  'WEAPON_BIRD_CRAP',
  'WEAPON_GARBAGEBAG',
  'WEAPON_HANDCUFFS',
  'PASSENGER_ROCKET',
  'AIRSTRIKE_ROCKET',
  'STINGER',
]);

let itemsPath = './data/items.json';
let componentsPath = './static/components.json';

await mkdir('./data').catch(() => {});

let items = JSON.parse(await readFile(itemsPath, 'utf8').catch(() => '{}'));
let components: Components = JSON.parse(await readFile(componentsPath, 'utf8').catch(() => '{}'));

const weaponDefaults = {
  GROUP_PISTOL: { height: 1, width: 2, weight: 1000 },
  GROUP_MELEE: { height: 2, width: 1, weight: 1000 },
  GROUP_SMG: { height: 2, width: 3, weight: 800 },
  GROUP_RIFLE: { height: 2, width: 5, weight: 3000 },
  GROUP_MG: { height: 2, width: 6, weight: 8000 },
  GROUP_SHOTGUN: { height: 2, width: 5, weight: 3500 },
  GROUP_STUNGUN: { height: 1, width: 2, weight: 230 },
  GROUP_SNIPER: { height: 2, width: 6, weight: 12000 },
  GROUP_HEAVY: { height: 2, width: 6, weight: 6000 },
  GROUP_THROWN: { height: 1, width: 1, weight: 500 },
  GROUP_FIREEXTINGUISHER: { height: 2, width: 1, weight: 1000 },
  GROUP_PETROLCAN: { height: 2, width: 2, weight: 1000 },
  GROUP_UNARMED: { height: 1, width: 1, weight: 500 },
};

async function FetchWeapons() {
  const headers = {};
  const etag = localStorage.getItem('weapons-etag');

  if (etag && (await exists(itemsPath)) && (await exists(componentsPath))) {
    // headers['If-None-Match'] = etag;
  }

  const response = await fetch('https://github.com/DurtyFree/gta-v-data-dumps/raw/refs/heads/master/weapons.json', {
    headers: headers,
  });

  if (response.status === 304) {
    return;
  }

  if (!response.ok) throw new Error(response.statusText);

  await response.json().then((data: RawWeapon[]) =>
    data.forEach(({ Name, IntHash, Category, Components, TranslatedLabel }) => {
      const defaults = Category && weaponDefaults[Category];

      if (
        !Category ||
        (Category === 'GROUP_UNARMED' && !Components.length) ||
        invalidWeapons.has(Name) ||
        Name.includes('VEHICLE_')
      )
        return;

      if (!defaults) return console.warn(`No default item properties exist for '${Category}'.`);

      Components.forEach(({ Name, IsDefault, TranslatedLabel }) => {
        if (!IsDefault && TranslatedLabel) {
          if (!components[TranslatedLabel.Name]) components[TranslatedLabel.Name] = [];
          if (!components[TranslatedLabel.Name].includes(Name)) components[TranslatedLabel.Name].push(Name);
        }
      });

      Name = Name.slice(7).toLowerCase().replace('_', '');

      if (items[Name]) return;

      items[Name] = {
        label: TranslatedLabel?.English || `${Name[0].toUpperCase()}${Name.slice(1)}`,
        category: Category === 'GROUP_THROWN' ? 'throwable' : 'weapon',
        hash: IntHash,
        weight: defaults.weight,
        width: defaults.width,
        height: defaults.height,
      };
    }),
  );

  localStorage.setItem('weapons-etag', response.headers.get('etag') ?? '');

  await writeFile(itemsPath, JSON.stringify(items, null, 2));
  await writeFile(componentsPath, JSON.stringify(components, null, 2));
}

FetchWeapons().then(async () => {});
