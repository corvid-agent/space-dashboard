import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { NasaService } from '../../core/services/nasa.service';
import { NeoObject } from '../../core/models/nasa.model';
import { formatDistance, threatLevel } from '../../core/utils/space.utils';

@Component({
  selector: 'app-asteroids',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <h1 class="page-title">Near-Earth Objects</h1>
        <p class="page-sub">Asteroids and comets tracked by NASA's NEO program</p>
      </div>

      <div class="filter-row">
        <button class="filter-btn" [class.active]="filter() === 'all'" (click)="filter.set('all')">All ({{ allNeos().length }})</button>
        <button class="filter-btn" [class.active]="filter() === 'hazardous'" (click)="filter.set('hazardous')">
          Hazardous ({{ hazardousCount() }})
        </button>
        <button class="filter-btn" [class.active]="filter() === 'closest'" (click)="filter.set('closest')">Closest First</button>
        <button class="filter-btn" [class.active]="filter() === 'largest'" (click)="filter.set('largest')">Largest First</button>
      </div>

      <div class="neo-table">
        <div class="table-header">
          <span class="col-name">Name</span>
          <span class="col-size">Diameter</span>
          <span class="col-vel">Velocity</span>
          <span class="col-dist">Miss Distance</span>
          <span class="col-date">Approach</span>
          <span class="col-threat">Status</span>
        </div>
        @for (neo of filteredNeos(); track neo.id) {
          <div class="table-row" [class]="'threat-' + getThreat(neo)">
            <span class="col-name">
              <span class="neo-name">{{ cleanName(neo.name) }}</span>
              @if (neo.is_potentially_hazardous_asteroid) {
                <span class="pha-badge">PHA</span>
              }
            </span>
            <span class="col-size">{{ diameterRange(neo) }}</span>
            <span class="col-vel text-mono">{{ getVelocity(neo) }} km/s</span>
            <span class="col-dist text-mono">{{ getMissDistance(neo) }}</span>
            <span class="col-date">{{ getApproachDate(neo) }}</span>
            <span class="col-threat">
              <span class="threat-chip" [class]="getThreat(neo)">{{ getThreat(neo) }}</span>
            </span>
          </div>
        }
      </div>

      @if (allNeos().length === 0) {
        <div class="glass-card skeleton" style="height: 400px"></div>
      }

      <!-- Size comparison -->
      @if (allNeos().length > 0) {
        <div class="glass-card size-compare">
          <span class="section-label">Size Comparison — Largest This Week vs Earth & Moon</span>

          <div class="compare-row">
            <!-- Reference bodies -->
            <div class="compare-item ref-body">
              <div class="ref-circle earth-circle">
                <svg viewBox="0 0 100 100" width="96" height="96">
                  <circle cx="50" cy="50" r="45" fill="var(--accent-cyan)" opacity="0.25"/>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent-cyan)" stroke-width="1.5" opacity="0.6"/>
                </svg>
              </div>
              <span class="compare-name ref-name">Earth</span>
              <span class="compare-size">12,742 km</span>
            </div>
            <div class="compare-item ref-body">
              <div class="ref-circle moon-circle">
                <svg viewBox="0 0 100 100" width="64" height="64">
                  <circle cx="50" cy="50" r="45" fill="var(--text-tertiary)" opacity="0.2"/>
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" opacity="0.5"/>
                </svg>
              </div>
              <span class="compare-name ref-name">Moon</span>
              <span class="compare-size">3,474 km</span>
            </div>

            <div class="compare-divider"></div>

            <!-- Asteroids -->
            @for (neo of largestFive(); track neo.id) {
              <div class="compare-item">
                <svg [attr.viewBox]="'0 0 100 100'" [style.width.px]="getCircleSize(neo)" [style.height.px]="getCircleSize(neo)">
                  <circle cx="50" cy="50" r="45" [attr.fill]="neo.is_potentially_hazardous_asteroid ? 'var(--accent-mars)' : 'var(--accent-nebula)'" opacity="0.6"/>
                </svg>
                <span class="compare-name">{{ cleanName(neo.name) }}</span>
                <span class="compare-size">{{ maxDiameter(neo) }}m</span>
              </div>
            }
          </div>

          <p class="scale-note">
            At true scale, Earth would be {{ earthScale() }}x wider than the largest asteroid shown.
            Even the Moon is {{ moonScale() }}x wider.
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding-top: var(--space-xl); padding-bottom: var(--space-2xl); display: flex; flex-direction: column; gap: var(--space-xl); }
    .page-title { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 0.95rem; }
    .page-header { display: flex; flex-direction: column; gap: var(--space-xs); }
    .filter-row { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
    .filter-btn {
      padding: var(--space-sm) var(--space-md); min-height: 44px;
      border-radius: var(--radius); background: var(--bg-card);
      border: 1px solid var(--border); color: var(--text-secondary);
      font-size: 0.875rem; font-weight: 500;
      transition: all 0.2s;
    }
    .filter-btn.active { background: var(--accent-nebula-dim); color: var(--accent-nebula); border-color: var(--accent-nebula); }
    .filter-btn:hover:not(.active) { background: var(--bg-hover); }
    .neo-table { display: flex; flex-direction: column; gap: 2px; }
    .table-header, .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.2fr 1fr 0.8fr;
      gap: var(--space-md); padding: var(--space-sm) var(--space-md);
      align-items: center; border-radius: var(--radius);
    }
    .table-header {
      font-size: 0.875rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--text-tertiary);
    }
    .table-row {
      background: var(--bg-card); font-size: 0.875rem;
      transition: background 0.2s;
    }
    .table-row:hover { background: var(--bg-hover); }
    .neo-name { font-weight: 600; }
    .pha-badge {
      font-size: 0.75rem; font-weight: 700; padding: 2px 6px;
      background: var(--accent-mars-dim); color: var(--accent-mars);
      border-radius: 3px; margin-left: var(--space-xs);
    }
    .col-size, .col-vel, .col-dist, .col-date { font-size: 0.875rem; color: var(--text-secondary); }
    .text-mono { font-family: var(--font-mono); }
    .threat-chip {
      font-size: 0.75rem; font-weight: 600; padding: 2px 8px;
      border-radius: 4px; text-transform: uppercase;
    }
    .threat-chip.safe { background: rgba(16,185,129,0.12); color: var(--status-safe); }
    .threat-chip.watch { background: rgba(245,158,11,0.12); color: var(--status-warn); }
    .threat-chip.danger { background: rgba(239,68,68,0.12); color: var(--status-danger); }
    .threat-danger { border-left: 2px solid var(--status-danger); }
    .threat-watch { border-left: 2px solid var(--status-warn); }
    .size-compare { display: flex; flex-direction: column; gap: var(--space-lg); }
    .compare-row { display: flex; align-items: flex-end; justify-content: center; gap: var(--space-xl); flex-wrap: wrap; }
    .compare-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); }
    .compare-name { font-size: 0.875rem; color: var(--text-secondary); text-align: center; max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
    .ref-name { color: var(--text-primary); font-weight: 600; }
    .compare-size { font-size: 0.875rem; color: var(--text-tertiary); font-family: var(--font-mono); }
    .ref-body { opacity: 0.9; }
    .compare-divider {
      width: 1px; height: 80px;
      background: var(--border);
      margin: 0 var(--space-sm);
      flex-shrink: 0;
    }
    .scale-note {
      font-size: 0.875rem; color: var(--text-tertiary);
      text-align: center; line-height: 1.5;
      padding-top: var(--space-sm);
      border-top: 1px solid var(--border);
    }
    @media (max-width: 768px) {
      .table-header { display: none; }
      .table-row { grid-template-columns: 1fr 1fr; font-size: 0.875rem; }
      .col-vel, .col-date { display: none; }
    }
  `],
})
export class AsteroidsComponent implements OnInit {
  private readonly nasa = inject(NasaService);

  readonly allNeos = signal<NeoObject[]>([]);
  readonly filter = signal<'all' | 'hazardous' | 'closest' | 'largest'>('all');

  readonly hazardousCount = computed(() =>
    this.allNeos().filter(n => n.is_potentially_hazardous_asteroid).length
  );

  readonly filteredNeos = computed(() => {
    let list = [...this.allNeos()];
    const f = this.filter();
    if (f === 'hazardous') {
      list = list.filter(n => n.is_potentially_hazardous_asteroid);
    }
    if (f === 'closest') {
      list.sort((a, b) => {
        const dA = parseFloat(a.close_approach_data[0]?.miss_distance?.kilometers || '999999999');
        const dB = parseFloat(b.close_approach_data[0]?.miss_distance?.kilometers || '999999999');
        return dA - dB;
      });
    } else if (f === 'largest') {
      list.sort((a, b) => b.estimated_diameter.meters.estimated_diameter_max - a.estimated_diameter.meters.estimated_diameter_max);
    }
    return list;
  });

  readonly largestFive = computed(() =>
    [...this.allNeos()]
      .sort((a, b) => b.estimated_diameter.meters.estimated_diameter_max - a.estimated_diameter.meters.estimated_diameter_max)
      .slice(0, 5)
  );

  readonly earthScale = computed(() => {
    const largest = this.largestFive()[0]?.estimated_diameter.meters.estimated_diameter_max || 1;
    return Math.round(12_742_000 / largest).toLocaleString();
  });

  readonly moonScale = computed(() => {
    const largest = this.largestFive()[0]?.estimated_diameter.meters.estimated_diameter_max || 1;
    return Math.round(3_474_000 / largest).toLocaleString();
  });

  ngOnInit(): void {
    this.nasa.loadNeoFeed().subscribe(feed => {
      const all = Object.values(feed.near_earth_objects).flat();
      this.allNeos.set(all);
    });
  }

  cleanName(name: string): string { return name.replace(/[()]/g, '').trim(); }

  diameterRange(neo: NeoObject): string {
    const min = neo.estimated_diameter.meters.estimated_diameter_min;
    const max = neo.estimated_diameter.meters.estimated_diameter_max;
    return `${Math.round(min)}–${Math.round(max)}m`;
  }

  maxDiameter(neo: NeoObject): number {
    return Math.round(neo.estimated_diameter.meters.estimated_diameter_max);
  }

  getVelocity(neo: NeoObject): string {
    return parseFloat(neo.close_approach_data[0]?.relative_velocity?.kilometers_per_second || '0').toFixed(1);
  }

  getMissDistance(neo: NeoObject): string {
    const km = parseFloat(neo.close_approach_data[0]?.miss_distance?.kilometers || '0');
    return formatDistance(km);
  }

  getApproachDate(neo: NeoObject): string {
    return neo.close_approach_data[0]?.close_approach_date || '';
  }

  getThreat(neo: NeoObject): string {
    const km = parseFloat(neo.close_approach_data[0]?.miss_distance?.kilometers || '0');
    const diamKm = neo.estimated_diameter.kilometers.estimated_diameter_max;
    return threatLevel(diamKm, km, neo.is_potentially_hazardous_asteroid);
  }

  getCircleSize(neo: NeoObject): number {
    const max = neo.estimated_diameter.meters.estimated_diameter_max;
    const largestMax = this.largestFive()[0]?.estimated_diameter.meters.estimated_diameter_max || 1;
    return Math.max(20, (max / largestMax) * 80);
  }
}
