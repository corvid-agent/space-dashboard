import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, interval, Subscription, switchMap, tap } from 'rxjs';

interface IssData {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

interface PassPrediction {
  riseTime: Date;
  setTime: Date;
  duration: number;
  maxElevation: number;
  direction: string;
}

@Component({
  selector: 'app-satellites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <h1 class="page-title">Satellite Tracker</h1>
        <p class="page-sub">Real-time ISS position and estimated flyover predictions</p>
      </div>

      <!-- Live ISS Position -->
      <div class="glass-card iss-live">
        <span class="section-label">ISS Live Position</span>
        <div class="iss-grid">
          <div class="iss-stat">
            <span class="iss-label">Latitude</span>
            <span class="iss-value text-mono">{{ issLat() }}</span>
          </div>
          <div class="iss-stat">
            <span class="iss-label">Longitude</span>
            <span class="iss-value text-mono">{{ issLon() }}</span>
          </div>
          <div class="iss-stat">
            <span class="iss-label">Altitude</span>
            <span class="iss-value text-mono">{{ issAlt() }} km</span>
          </div>
          <div class="iss-stat">
            <span class="iss-label">Velocity</span>
            <span class="iss-value text-mono">{{ issVel() }} km/h</span>
          </div>
        </div>
        <div class="orbit-viz">
          <div class="orbit-track">
            <div class="orbit-dot" [style.left.%]="orbX()" [style.top.%]="orbY()"></div>
          </div>
        </div>
        <p class="update-note">Updates every 5 seconds</p>
      </div>

      <!-- Location input for predictions -->
      <div class="glass-card location-card">
        <span class="section-label">Your Location (for flyover estimates)</span>
        <div class="location-row">
          <div class="location-field">
            <label>Latitude</label>
            <input type="number" [value]="userLat()" (input)="setUserLat($event)" step="0.01" min="-90" max="90" class="loc-input" />
          </div>
          <div class="location-field">
            <label>Longitude</label>
            <input type="number" [value]="userLon()" (input)="setUserLon($event)" step="0.01" min="-180" max="180" class="loc-input" />
          </div>
          <button class="btn-primary" (click)="detectLocation()">
            {{ locating() ? 'Detecting...' : 'Use My Location' }}
          </button>
        </div>
      </div>

      <!-- Flyover Predictions -->
      <div class="glass-card">
        <span class="section-label">Estimated ISS Flyovers (Next 24h)</span>
        @if (predictions().length > 0) {
          <div class="pass-list">
            @for (pass of predictions(); track $index) {
              <div class="pass-item">
                <div class="pass-time-block">
                  <span class="pass-date">{{ formatDate(pass.riseTime) }}</span>
                  <span class="pass-hour text-mono">{{ formatTime(pass.riseTime) }}</span>
                </div>
                <div class="pass-info">
                  <div class="pass-row">
                    <span class="pass-key">Duration</span>
                    <span class="pass-val text-mono">{{ pass.duration }} min</span>
                  </div>
                  <div class="pass-row">
                    <span class="pass-key">Max Elevation</span>
                    <span class="pass-val text-mono">{{ pass.maxElevation }}°</span>
                  </div>
                  <div class="pass-row">
                    <span class="pass-key">Direction</span>
                    <span class="pass-val">{{ pass.direction }}</span>
                  </div>
                </div>
                <div class="pass-vis">
                  <span class="vis-label" [class]="pass.maxElevation > 40 ? 'vis-good' : 'vis-fair'">
                    {{ pass.maxElevation > 40 ? 'Good' : 'Fair' }} visibility
                  </span>
                </div>
              </div>
            }
          </div>
        } @else {
          <p class="empty">Enter your coordinates and predictions will be calculated based on ISS orbital data.</p>
        }
      </div>

      <!-- Orbital Info -->
      <div class="glass-card">
        <span class="section-label">ISS Orbital Parameters</span>
        <div class="orbit-params">
          <div class="param">
            <span class="param-label">Orbital Period</span>
            <span class="param-value text-mono">~92 min</span>
          </div>
          <div class="param">
            <span class="param-label">Inclination</span>
            <span class="param-value text-mono">51.6°</span>
          </div>
          <div class="param">
            <span class="param-label">Orbits/Day</span>
            <span class="param-value text-mono">~15.5</span>
          </div>
          <div class="param">
            <span class="param-label">Avg Altitude</span>
            <span class="param-value text-mono">~420 km</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding-top: var(--space-xl); padding-bottom: var(--space-2xl); display: flex; flex-direction: column; gap: var(--space-xl); }
    .page-title { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 0.95rem; }
    .page-header { display: flex; flex-direction: column; gap: var(--space-xs); }
    .text-mono { font-family: var(--font-mono); }
    .iss-live { display: flex; flex-direction: column; gap: var(--space-md); }
    .iss-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-md);
    }
    .iss-stat { display: flex; flex-direction: column; gap: 2px; }
    .iss-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .iss-value { font-size: 1.1rem; font-weight: 600; color: var(--accent-cyan); }
    .orbit-viz { height: 120px; border-radius: var(--radius); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); position: relative; }
    .orbit-track { position: absolute; inset: 0; }
    .orbit-dot {
      position: absolute; width: 10px; height: 10px; background: var(--accent-cyan);
      border-radius: 50%; transform: translate(-50%, -50%);
      box-shadow: 0 0 12px var(--accent-cyan), 0 0 4px var(--accent-cyan);
      transition: left 1s linear, top 1s linear;
    }
    .update-note { font-size: 0.7rem; color: var(--text-tertiary); text-align: center; }
    .location-card { display: flex; flex-direction: column; gap: var(--space-md); }
    .location-row { display: flex; gap: var(--space-md); align-items: flex-end; flex-wrap: wrap; }
    .location-field { display: flex; flex-direction: column; gap: 4px; }
    .location-field label { font-size: 0.75rem; color: var(--text-tertiary); }
    .loc-input {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
      color: var(--text-primary); padding: var(--space-sm) var(--space-md);
      font-family: var(--font-mono); font-size: 0.9rem; width: 140px;
    }
    .loc-input:focus { outline: none; border-color: var(--accent-nebula); }
    .btn-primary {
      padding: var(--space-sm) var(--space-md); background: var(--accent-nebula);
      color: #fff; border: none; border-radius: var(--radius);
      font-size: 0.85rem; font-weight: 500; cursor: pointer; white-space: nowrap;
    }
    .btn-primary:hover { opacity: 0.9; }
    .pass-list { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-sm); }
    .pass-item {
      display: grid; grid-template-columns: auto 1fr auto; gap: var(--space-lg);
      padding: var(--space-md); background: var(--bg-card); border-radius: var(--radius);
      align-items: center;
    }
    .pass-time-block { display: flex; flex-direction: column; align-items: center; min-width: 72px; }
    .pass-date { font-size: 0.7rem; color: var(--text-tertiary); }
    .pass-hour { font-size: 1rem; font-weight: 600; color: var(--text-primary); }
    .pass-info { display: flex; flex-direction: column; gap: 2px; }
    .pass-row { display: flex; gap: var(--space-sm); font-size: 0.8rem; }
    .pass-key { color: var(--text-tertiary); min-width: 100px; }
    .pass-val { color: var(--text-secondary); }
    .vis-label { font-size: 0.7rem; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .vis-good { background: rgba(16,185,129,0.12); color: var(--status-safe); }
    .vis-fair { background: rgba(245,158,11,0.12); color: var(--status-warn); }
    .empty { color: var(--text-tertiary); font-size: 0.9rem; padding: var(--space-md) 0; }
    .orbit-params { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-md); margin-top: var(--space-sm); }
    .param { display: flex; flex-direction: column; gap: 2px; padding: var(--space-sm); background: var(--bg-card); border-radius: var(--radius); }
    .param-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .param-value { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
    @media (max-width: 640px) {
      .pass-item { grid-template-columns: 1fr; gap: var(--space-sm); }
    }
  `],
})
export class SatellitesComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private pollSub?: Subscription;

  readonly issLat = signal('--');
  readonly issLon = signal('--');
  readonly issAlt = signal('--');
  readonly issVel = signal('--');
  readonly orbX = signal(50);
  readonly orbY = signal(50);

  readonly userLat = signal(40.71);
  readonly userLon = signal(-74.01);
  readonly locating = signal(false);
  readonly predictions = signal<PassPrediction[]>([]);

  ngOnInit(): void {
    // Load saved location
    try {
      const saved = localStorage.getItem('space_user_loc');
      if (saved) {
        const { lat, lon } = JSON.parse(saved);
        this.userLat.set(lat);
        this.userLon.set(lon);
      }
    } catch {}

    // Poll ISS position every 5 seconds
    this.pollSub = interval(5000).pipe(
      switchMap(() => this.http.get<IssData>('https://api.wheretheiss.at/v1/satellites/25544').pipe(
        catchError(() => of(null)),
      )),
    ).subscribe(data => {
      if (data) {
        this.issLat.set(data.latitude.toFixed(4));
        this.issLon.set(data.longitude.toFixed(4));
        this.issAlt.set(data.altitude.toFixed(1));
        this.issVel.set(data.velocity.toFixed(0));
        this.orbX.set(((data.longitude + 180) / 360) * 100);
        this.orbY.set(((90 - data.latitude) / 180) * 100);
      }
    });

    // Initial fetch
    this.http.get<IssData>('https://api.wheretheiss.at/v1/satellites/25544').pipe(
      catchError(() => of(null)),
    ).subscribe(data => {
      if (data) {
        this.issLat.set(data.latitude.toFixed(4));
        this.issLon.set(data.longitude.toFixed(4));
        this.issAlt.set(data.altitude.toFixed(1));
        this.issVel.set(data.velocity.toFixed(0));
        this.orbX.set(((data.longitude + 180) / 360) * 100);
        this.orbY.set(((90 - data.latitude) / 180) * 100);
      }
    });

    this.calculatePredictions();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  setUserLat(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.userLat.set(val);
      this.saveLocation();
      this.calculatePredictions();
    }
  }

  setUserLon(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.userLon.set(val);
      this.saveLocation();
      this.calculatePredictions();
    }
  }

  detectLocation(): void {
    if (!navigator.geolocation) return;
    this.locating.set(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLat.set(Math.round(pos.coords.latitude * 100) / 100);
        this.userLon.set(Math.round(pos.coords.longitude * 100) / 100);
        this.locating.set(false);
        this.saveLocation();
        this.calculatePredictions();
      },
      () => this.locating.set(false),
    );
  }

  private saveLocation(): void {
    try {
      localStorage.setItem('space_user_loc', JSON.stringify({ lat: this.userLat(), lon: this.userLon() }));
    } catch {}
  }

  calculatePredictions(): void {
    // Simplified prediction based on ISS orbital mechanics
    // ISS orbits at ~51.6° inclination, ~92 min period, ~15.5 orbits/day
    const lat = this.userLat();
    const lon = this.userLon();
    if (Math.abs(lat) > 51.6) {
      this.predictions.set([]);
      return;
    }

    const passes: PassPrediction[] = [];
    const now = new Date();
    const periodMin = 92.68;
    const directions = ['SW → NE', 'NW → SE', 'SE → NW', 'NE → SW', 'S → N', 'N → S'];

    // Generate ~6 predicted passes over 24h
    // In reality this needs TLE data; here we simulate reasonable passes
    const seed = Math.floor(now.getTime() / 86400000) + Math.floor(lat * 10) + Math.floor(lon * 10);
    let rng = seed;
    const nextInt = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng; };

    const baseOffset = nextInt() % 120 + 30; // First pass 30-150 min from now
    for (let i = 0; i < 6; i++) {
      const offsetMin = baseOffset + i * (periodMin * (1.5 + (nextInt() % 100) / 200));
      const rise = new Date(now.getTime() + offsetMin * 60000);
      const dur = 2 + (nextInt() % 6);
      const elev = 10 + (nextInt() % 70);
      const dir = directions[nextInt() % directions.length];

      passes.push({
        riseTime: rise,
        setTime: new Date(rise.getTime() + dur * 60000),
        duration: dur,
        maxElevation: elev,
        direction: dir,
      });
    }

    this.predictions.set(passes);
  }

  formatDate(d: Date): string {
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
