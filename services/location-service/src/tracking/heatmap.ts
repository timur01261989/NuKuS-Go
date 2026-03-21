/**
 * Demand Heatmap Generator
 * Aggregates driver positions into hexagonal grid cells (H3 resolution 8)
 * Used for: surge pricing zones, supply/demand visualization in admin panel
 */
import { latLngToCell, gridDisk } from "@unigo/geo-lib";

export interface HeatmapCell {
  cell_id: string;
  driver_count: number;
  lat: number;
  lng: number;
}

// In-memory aggregation (refreshed every 10s)
const cellCounts = new Map<string, number>();

export async function updateHeatmap(lat: number, lng: number): Promise<void> {
  const cell = await latLngToCell(lat, lng, 8); // ~0.7km² hexagons
  cellCounts.set(cell, (cellCounts.get(cell) || 0) + 1);
}

export function getHeatmapSnapshot(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  for (const [cell_id, driver_count] of cellCounts.entries()) {
    // Parse rough center from cell_id (simplified)
    cells.push({ cell_id, driver_count, lat: 0, lng: 0 });
  }
  return cells;
}

export function clearHeatmap(): void {
  cellCounts.clear();
}

/**
 * Get cells with highest demand (top N)
 */
export function getHotspots(topN = 20): HeatmapCell[] {
  return getHeatmapSnapshot()
    .sort((a, b) => b.driver_count - a.driver_count)
    .slice(0, topN);
}
