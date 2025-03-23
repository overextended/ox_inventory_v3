import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { exists } from './utils.js';

interface Weapon {
  IntHash: number;
  Category: string;
}

interface Weapons {
  [Name: string]: Weapon;
}

interface Components {
  [Name: string]: string[];
}

interface RawWeapon extends Weapon {
  Name: string;
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

let weaponsPath = './data/weapons.json';
let componentsPath = './data/components.json';

await mkdir('./data').catch(() => {});

let weapons: Weapons = JSON.parse(await readFile(weaponsPath, 'utf8').catch(() => '{}'));
let components: Components = JSON.parse(await readFile(componentsPath, 'utf8').catch(() => '{}'));

async function FetchWeapons() {
  const headers = {};
  const etag = localStorage.getItem('weapons-etag');

  console.log('etag', etag);

  if (etag && (await exists(weaponsPath)) && (await exists(componentsPath))) {
    headers['If-None-Match'] = etag;
  }

  const response = await fetch('https://github.com/DurtyFree/gta-v-data-dumps/raw/refs/heads/master/weapons.json', {
    headers: headers,
  });

  if (response.status === 304) {
    return;
  }

  if (!response.ok) throw new Error(response.statusText);

  await response.json().then((data: RawWeapon[]) =>
    data.forEach(({ Name, IntHash, Category, Components }) => {
      if (
        !Category ||
        (Category === 'GROUP_UNARMED' && !Components.length) ||
        invalidWeapons.has(Name) ||
        Name.includes('VEHICLE_')
      )
        return;

      Components.filter(({ Name, IsDefault, TranslatedLabel }) => {
        if (!IsDefault && TranslatedLabel) {
          if (!components[TranslatedLabel.Name]) components[TranslatedLabel.Name] = [];
          if (!components[TranslatedLabel.Name].includes(Name)) components[TranslatedLabel.Name].push(Name);
        }
      });

      weapons[Name] = {
        IntHash,
        Category,
      };
    }),
  );

  localStorage.setItem('weapons-etag', response.headers.get('etag') ?? '');

  await writeFile(weaponsPath, JSON.stringify(weapons, null, 2));
  await writeFile(componentsPath, JSON.stringify(components, null, 2));
}

FetchWeapons().then(async () => {
  const sqlItems = await readFile('./sql/items.sql', 'utf8').then((file) => file.toLowerCase());
  const weaponNames = Object.keys(weapons);

  weaponNames.forEach((name) => {
    const formattedName = name.slice(7).replace('_', '').toLowerCase();

    if (!sqlItems.includes(`('${formattedName}'`)) {
      console.log(`'${name}' is missing from items.sql`);
    }
  });
});
