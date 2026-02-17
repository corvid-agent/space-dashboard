import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { SolarFlare, CoronalMassEjection, GeomagneticStorm } from '../../core/models/nasa.model';
import { flareClassSeverity, kpToLevel, timeAgo } from '../../core/utils/space.utils';

@Component({
  selector: 'app-space-weather',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card weather-card">
      <span class="section-label">Space Weather — Last 30 Days</span>

      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-value text-sun">{{ flares().length }}</span>
          <span class="stat-label">Solar Flares</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-mars">{{ cmes().length }}</span>
          <span class="stat-label">CMEs</span>
        </div>
        <div class="stat-item">
          <span class="stat-value text-nebula">{{ storms().length }}</span>
          <span class="stat-label">Geo Storms</span>
        </div>
      </div>

      @if (recentFlares().length > 0) {
        <div class="event-section">
          <h4 class="event-title">Recent Solar Flares</h4>
          @for (f of recentFlares(); track f.flrID) {
            <div class="event-row">
              <span class="flare-class" [class]="'severity-' + getSeverity(f.classType)">{{ f.classType }}</span>
              <span class="event-time">{{ ago(f.beginTime) }}</span>
              @if (f.sourceLocation) {
                <span class="event-detail">{{ f.sourceLocation }}</span>
              }
            </div>
          }
        </div>
      }

      @if (recentStorms().length > 0) {
        <div class="event-section">
          <h4 class="event-title">Geomagnetic Storms</h4>
          @for (s of recentStorms(); track s.gstID) {
            <div class="event-row">
              <span class="kp-badge" [style.color]="kpColor(s.kpIndex)">Kp {{ s.kpIndex ?? '?' }}</span>
              <span class="event-time">{{ ago(s.startTime) }}</span>
              <span class="event-detail">{{ kpLevel(s.kpIndex) }}</span>
            </div>
          }
        </div>
      }

      @if (flares().length === 0 && cmes().length === 0 && storms().length === 0) {
        <p class="quiet-msg">Space weather is quiet. No significant events in the last 30 days.</p>
      }
    </div>
  `,
  styles: [`
    .weather-card { display: flex; flex-direction: column; gap: var(--space-md); }
    .stats-row { display: flex; gap: var(--space-lg); }
    .stat-item { display: flex; flex-direction: column; gap: 2px; }
    .stat-value { font-family: var(--font-mono); font-size: 1.5rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--text-tertiary); }
    .event-section { display: flex; flex-direction: column; gap: var(--space-sm); }
    .event-title { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
    .event-row {
      display: flex; align-items: center; gap: var(--space-md);
      padding: var(--space-xs) var(--space-sm);
      border-radius: var(--radius); background: rgba(10,10,30,0.4);
    }
    .flare-class {
      font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem;
      min-width: 40px;
    }
    .severity-minor { color: var(--text-tertiary); }
    .severity-moderate { color: var(--accent-earth); }
    .severity-strong { color: var(--status-warn); }
    .severity-severe { color: var(--accent-mars); }
    .severity-extreme { color: var(--status-danger); }
    .kp-badge { font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem; min-width: 40px; }
    .event-time { font-size: 0.75rem; color: var(--text-tertiary); min-width: 60px; }
    .event-detail { font-size: 0.8rem; color: var(--text-secondary); }
    .quiet-msg { color: var(--text-tertiary); font-size: 0.9rem; font-style: italic; }
  `],
})
export class SpaceWeatherComponent {
  readonly flares = input.required<SolarFlare[]>();
  readonly cmes = input.required<CoronalMassEjection[]>();
  readonly storms = input.required<GeomagneticStorm[]>();

  readonly recentFlares = computed(() =>
    this.flares().slice(-5).reverse()
  );

  readonly recentStorms = computed(() =>
    this.storms().slice(-5).reverse()
  );

  getSeverity(classType: string): string {
    return flareClassSeverity(classType);
  }

  kpLevel(kp: number | null): string {
    return kpToLevel(kp);
  }

  kpColor(kp: number | null): string {
    if (kp == null) return 'var(--text-tertiary)';
    if (kp <= 3) return 'var(--status-safe)';
    if (kp <= 5) return 'var(--status-warn)';
    return 'var(--status-danger)';
  }

  ago(dateStr: string): string {
    return timeAgo(dateStr);
  }
}
