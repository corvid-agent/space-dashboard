import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { NeoObject } from '../../core/models/nasa.model';
import { formatDistance, threatLevel } from '../../core/utils/space.utils';

@Component({
  selector: 'app-neo-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card neo-card">
      <div class="neo-header">
        <span class="section-label">Near-Earth Objects</span>
        <span class="neo-count">{{ neos().length }} tracked</span>
      </div>
      <div class="neo-list">
        @for (neo of topNeos(); track neo.id) {
          <div class="neo-row">
            <div class="neo-info">
              <div class="neo-name-row">
                <span class="neo-name">{{ cleanName(neo.name) }}</span>
                @if (neo.is_potentially_hazardous_asteroid) {
                  <span class="hazard-badge">PHA</span>
                }
              </div>
              <span class="neo-detail">
                {{ diameterRange(neo) }} ·
                {{ getVelocity(neo) }} km/s
              </span>
            </div>
            <div class="neo-distance">
              <span class="distance-value" [class]="getThreat(neo)">{{ getMissDistance(neo) }}</span>
              <span class="distance-label">{{ getLunarDistance(neo) }} LD</span>
            </div>
          </div>
        }
      </div>
      @if (neos().length > 8) {
        <span class="neo-more">+ {{ neos().length - 8 }} more objects</span>
      }
    </div>
  `,
  styles: [`
    .neo-card { display: flex; flex-direction: column; gap: var(--space-md); }
    .neo-header { display: flex; justify-content: space-between; align-items: center; }
    .neo-count { font-size: 0.8rem; color: var(--accent-cyan); font-family: var(--font-mono); }
    .neo-list { display: flex; flex-direction: column; gap: var(--space-sm); }
    .neo-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-sm); border-radius: var(--radius);
      background: rgba(10, 10, 30, 0.4);
      transition: background 0.2s;
    }
    .neo-row:hover { background: var(--bg-hover); }
    .neo-info { display: flex; flex-direction: column; gap: 2px; }
    .neo-name-row { display: flex; align-items: center; gap: var(--space-sm); }
    .neo-name { font-weight: 600; font-size: 0.9rem; }
    .hazard-badge {
      font-size: 0.65rem; font-weight: 700; padding: 1px 6px;
      background: var(--accent-mars-dim); color: var(--accent-mars);
      border-radius: 4px; letter-spacing: 0.05em;
    }
    .neo-detail { font-size: 0.75rem; color: var(--text-tertiary); }
    .neo-distance { text-align: right; display: flex; flex-direction: column; gap: 2px; }
    .distance-value { font-family: var(--font-mono); font-size: 0.85rem; font-weight: 600; }
    .distance-label { font-size: 0.7rem; color: var(--text-tertiary); }
    .safe { color: var(--status-safe); }
    .watch { color: var(--status-warn); }
    .danger { color: var(--status-danger); }
    .neo-more { font-size: 0.8rem; color: var(--text-tertiary); text-align: center; }
  `],
})
export class NeoCardComponent {
  readonly neos = input.required<NeoObject[]>();

  readonly topNeos = computed(() =>
    this.neos()
      .sort((a, b) => {
        const distA = parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers || '0');
        const distB = parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers || '0');
        return distA - distB;
      })
      .slice(0, 8)
  );

  cleanName(name: string): string {
    return name.replace(/[()]/g, '').trim();
  }

  diameterRange(neo: NeoObject): string {
    const min = neo.estimated_diameter.meters.estimated_diameter_min;
    const max = neo.estimated_diameter.meters.estimated_diameter_max;
    return `${Math.round(min)}–${Math.round(max)}m`;
  }

  getVelocity(neo: NeoObject): string {
    const v = parseFloat(neo.close_approach_data[0]?.relative_velocity?.kilometers_per_second || '0');
    return v.toFixed(1);
  }

  getMissDistance(neo: NeoObject): string {
    const km = parseFloat(neo.close_approach_data[0]?.miss_distance?.kilometers || '0');
    return formatDistance(km);
  }

  getLunarDistance(neo: NeoObject): string {
    const ld = parseFloat(neo.close_approach_data[0]?.miss_distance?.lunar || '0');
    return ld.toFixed(1);
  }

  getThreat(neo: NeoObject): string {
    const km = parseFloat(neo.close_approach_data[0]?.miss_distance?.kilometers || '0');
    const diamKm = neo.estimated_diameter.kilometers.estimated_diameter_max;
    return threatLevel(diamKm, km, neo.is_potentially_hazardous_asteroid);
  }
}
