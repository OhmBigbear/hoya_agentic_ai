import type {
  UiActionTargetId,
  UiRegionDefinition,
  UiRegionId,
  UiSurfaceDefinition,
  UiSurfaceId,
  UiWidgetRegistryEntry,
  UiWidgetType,
} from './types';

export type UiWidgetRegistry = ReadonlyMap<UiWidgetType, UiWidgetRegistryEntry>;
export type UiSurfaceRegistry = ReadonlyMap<UiSurfaceId, UiSurfaceDefinition>;

export function createWidgetRegistry(entries: UiWidgetRegistryEntry[]): UiWidgetRegistry {
  return new Map(entries.map((entry) => [entry.type, entry]));
}

export function getWidgetRegistryEntry(
  registry: UiWidgetRegistry,
  widgetType: UiWidgetType | string,
): UiWidgetRegistryEntry | undefined {
  return registry.get(widgetType as UiWidgetType);
}

export function createSurfaceRegistry(surfaces: UiSurfaceDefinition[]): UiSurfaceRegistry {
  return new Map(surfaces.map((surface) => [surface.id, surface]));
}

export function getSurfaceDefinition(
  registry: UiSurfaceRegistry,
  surfaceId: UiSurfaceId,
): UiSurfaceDefinition | undefined {
  return registry.get(surfaceId);
}

export function listSurfaceRegions(surface: UiSurfaceDefinition): UiRegionDefinition[] {
  return [...surface.regions];
}

export function isRegionAllowed(surface: UiSurfaceDefinition, regionId: UiRegionId): boolean {
  return surface.regions.some((region) => region.id === regionId);
}

export function isActionTargetAllowed(
  surface: UiSurfaceDefinition,
  actionTargetId: UiActionTargetId,
): boolean {
  return Boolean(surface.actionTargets?.some((target) => target.id === actionTargetId));
}
