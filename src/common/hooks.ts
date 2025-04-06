import { cache } from '@overextended/ox_lib';
import type { ItemProperties } from './item';

type EventHooks = OpenInventoryHook | MoveItemHook;

export interface OpenInventoryHook {
  playerId: number;
  inventoryId: string;
  inventoryType: string;
}

export interface MoveItemHook {
  playerId: number;
  item: ItemProperties;
  toSlot: number;
  quantity: number;
  splitStack: boolean;
  inventoryId: string;
  inventoryType: string;
  toInventoryId: string;
  toInventoryType: string;
}

interface EventHookProperties {
  handler?: string | EventHookHandler;
  validate?: string | EventHookValidator;
  itemType?: string;
  itemName?: string;
  inventoryId?: string;
  inventoryType?: string;
}

interface EventHook extends EventHookProperties {
  id: number;
  resource: string;
}

type EventHookHandler = (payload: any) => void;
type EventHookValidator = (payload: any) => boolean | Promise<boolean>;

const registeredEventHooks: Map<string, Set<EventHook>> = new Map();
let hookId = 0;

/**
 * Registers a new hook for a specific event, allowing pre-validation and cancellation.
 */
export function RegisterEventHook(eventName: string, properties: EventHookProperties) {
  if (!registeredEventHooks.has(eventName)) registeredEventHooks.set(eventName, new Set());

  const hook = {
    ...properties,
    id: ++hookId,
    resource: GetInvokingResource(),
  };

  registeredEventHooks.get(eventName).add(hook);

  return hookId;
}

/**
 * Removes an event hook for a specified resource with the given hookId, or all hooks
 * if hookId is not specified.
 */
export function RemoveResourceHooks(resourceName: string, hookId?: number) {
  registeredEventHooks.forEach((hooks) => {
    hooks.forEach((hook) => {
      if (resourceName !== hook.resource || (hookId && hook.id === hookId)) return;

      hooks.delete(hook);
    });
  });
}

/**
 * Iterates over and triggers all registered event hooks with the given name, until false is received.
 */
export async function TriggerEventHooks(eventName: string, payload: EventHooks) {
  const eventHooks = registeredEventHooks.get(eventName);
  const handlers: EventHookHandler[] = [];
  const hookResource = {
    success: true,
    payload,

    [Symbol.dispose]: () => {
      if (!hookResource.success) return;

      for (const handler of handlers) handler(payload);
    },
  };

  if (!eventHooks || eventHooks.size === 0) return hookResource;

  for (const hook of eventHooks) {
    if ('item' in payload) {
      if (hook.itemType && payload.item.type !== hook.itemType) continue;
      if (hook.itemName && payload.item.name !== hook.itemName) continue;
    }

    if (
      hook.inventoryId &&
      payload.inventoryId !== hook.inventoryId &&
      (!('toInventoryId' in payload) || payload.toInventoryId !== hook.inventoryId)
    )
      continue;

    if (
      hook.inventoryType &&
      payload.inventoryType !== hook.inventoryType &&
      (!('toInventoryType' in payload) || payload.toInventoryType !== hook.inventoryType)
    )
      continue;

    const validate = (
      typeof hook.validate === 'string' ? exports[hook.resource][hook.validate] : hook.validate
    ) as EventHookValidator;

    const response = validate ? await validate(payload) : true;

    if (!response) {
      hookResource.success = false;

      return hookResource;
    }

    const handler = (
      typeof hook.handler === 'string' ? exports[hook.resource][hook.handler] : hook.handler
    ) as EventHookHandler;

    if (handler) handlers.push(handler);
  }

  return hookResource;
}

on('onResourceStop', RemoveResourceHooks);

exports('registerEventHook', RegisterEventHook);
exports('removeEventHooks', (hookId?: number) => RemoveResourceHooks(GetInvokingResource() || cache.resource, hookId));

// RegisterEventHook('moveItem', {
//   inventoryType: 'player',
//   itemName: 'ammo_9',
//   validate: (payload: MoveItemHook) => {
//     console.log(`Got 'moveItem' event for ${payload.item.name}`);
//     return payload.inventoryType === 'player';
//   },
//   handler: (payload: MoveItemHook) => {
//     console.log(`Moved ${payload.item.name}!`);
//   },
// });

// RegisterEventHook('openInventory', {
//   inventoryType: 'glovebox',
//   handler: (payload: OpenInventoryHook) => {
//     console.log(`Opened ${payload.inventoryId}!`);
//   },
// });
