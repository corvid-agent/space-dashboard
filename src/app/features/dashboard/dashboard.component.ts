import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NasaService } from '../../core/services/nasa.service';
import { ApodResponse, NeoObject, IssPosition, PeopleInSpace, SolarFlare, CoronalMassEjection, GeomagneticStorm, EpicImage } from '../../core/models/nasa.model';
import { ApodCardComponent } from '../../shared/components/apod-card.component';
import { NeoCardComponent } from '../../shared/components/neo-card.component';
import { IssTrackerComponent } from '../../shared/components/iss-tracker.component';
import { SpaceWeatherComponent } from '../../shared/components/space-weather.component';
import { EarthViewComponent } from '../../shared/components/earth-view.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ApodCardComponent, NeoCardComponent, IssTrackerComponent, SpaceWeatherComponent, EarthViewComponent],
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <div class="title-wrap">
          <h1 class="page-title">Mission Control</h1>
          <p class="page-sub">Live data from NASA, DSCOVR, and the ISS</p>
        </div>
        <div class="live-badge">
          <span class="live-dot"></span>
          LIVE
        </div>
      </div>

      @if (rateLimited()) {
        <div class="rate-limit-banner glass-card">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>NASA API rate limit reached.</strong>
            The DEMO_KEY allows only 30 requests/hour.
            Get a free key (1,000 req/hr) at
            <a href="https://api.nasa.gov" target="_blank" rel="noopener">api.nasa.gov</a>
            and update <code>src/app/core/config/api.config.ts</code>.
          </div>
        </div>
      }

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card glass-card">
          <span class="stat-value text-cyan">{{ neos().length }}</span>
          <span class="stat-label">Near-Earth Objects</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-sun">{{ flares().length }}</span>
          <span class="stat-label">Solar Flares (30d)</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-earth">{{ peopleCount() }}</span>
          <span class="stat-label">Humans in Space</span>
        </div>
        <div class="stat-card glass-card">
          <span class="stat-value text-mars">{{ cmes().length }}</span>
          <span class="stat-label">CMEs (30d)</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- APOD -->
        @if (apod()) {
          <div class="full-width">
            <app-apod-card [apod]="apod()!" />
          </div>
        } @else {
          <div class="full-width glass-card skeleton" style="height: 300px"></div>
        }

        <!-- ISS Tracker -->
        @if (issPosition()) {
          <app-iss-tracker [position]="issPosition()!" [people]="people()" />
        } @else {
          <div class="glass-card skeleton" style="height: 320px"></div>
        }

        <!-- NEO Feed -->
        @if (neos().length > 0) {
          <app-neo-card [neos]="neos()" />
        } @else if (!rateLimited()) {
          <div class="glass-card skeleton" style="height: 320px"></div>
        }

        <!-- Space Weather -->
        <app-space-weather [flares]="flares()" [cmes]="cmes()" [storms]="storms()" />

        <!-- Earth View -->
        @if (epicImages().length > 0) {
          <app-earth-view [images]="epicImages()" />
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding-top: var(--space-xl); padding-bottom: var(--space-2xl); display: flex; flex-direction: column; gap: var(--space-xl); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .title-wrap { display: flex; flex-direction: column; gap: var(--space-xs); }
    .page-title { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 0.95rem; }
    .live-badge {
      display: flex; align-items: center; gap: var(--space-sm);
      padding: var(--space-xs) var(--space-md);
      background: var(--accent-cyan-dim); color: var(--accent-cyan);
      border-radius: var(--radius); font-size: 0.75rem;
      font-weight: 700; letter-spacing: 0.1em;
    }
    .live-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--accent-cyan);
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
    .rate-limit-banner {
      display: flex; align-items: flex-start; gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border-color: #f59e0b; color: #fbbf24;
      font-size: 0.85rem; line-height: 1.5;
    }
    .rate-limit-banner a { color: var(--accent-nebula); text-decoration: underline; }
    .rate-limit-banner code {
      background: rgba(255,255,255,0.08); padding: 1px 6px;
      border-radius: 3px; font-size: 0.8rem;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
    }
    .stat-card {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-xs); text-align: center;
    }
    .stat-value { font-family: var(--font-mono); font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.75rem; color: var(--text-tertiary); }
    @media (max-width: 640px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .page-title { font-size: 1.5rem; }
    }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly nasa = inject(NasaService);

  readonly apod = signal<ApodResponse | null>(null);
  readonly neos = signal<NeoObject[]>([]);
  readonly issPosition = signal<IssPosition | null>(null);
  readonly people = signal<PeopleInSpace | null>(null);
  readonly flares = signal<SolarFlare[]>([]);
  readonly cmes = signal<CoronalMassEjection[]>([]);
  readonly storms = signal<GeomagneticStorm[]>([]);
  readonly epicImages = signal<EpicImage[]>([]);
  readonly peopleCount = signal(0);
  readonly rateLimited = signal(false);

  private issInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const onError = (err: HttpErrorResponse) => {
      if (err.status === 429 || err.error?.error?.code === 'OVER_RATE_LIMIT') {
        this.rateLimited.set(true);
      }
    };

    this.nasa.loadApod().subscribe({
      next: a => this.apod.set(a),
      error: onError,
    });

    this.nasa.loadNeoFeed().subscribe({
      next: feed => {
        const all = Object.values(feed.near_earth_objects).flat();
        this.neos.set(all);
      },
      error: onError,
    });

    this.loadIss();
    this.issInterval = setInterval(() => this.loadIss(), 10_000);

    this.nasa.loadPeopleInSpace().subscribe(p => {
      this.people.set(p);
      this.peopleCount.set(p.number);
    });

    this.nasa.loadSolarFlares().subscribe({
      next: f => this.flares.set(f),
      error: onError,
    });
    this.nasa.loadCMEs().subscribe({
      next: c => this.cmes.set(c),
      error: onError,
    });
    this.nasa.loadGeomagneticStorms().subscribe({
      next: s => this.storms.set(s),
      error: onError,
    });
    this.nasa.loadEpicImages().subscribe({
      next: i => this.epicImages.set(i),
      error: onError,
    });
  }

  ngOnDestroy(): void {
    if (this.issInterval) clearInterval(this.issInterval);
  }

  private loadIss(): void {
    this.nasa.loadIssPosition().subscribe({
      next: pos => this.issPosition.set(pos),
      error: () => {},
    });
  }
}
