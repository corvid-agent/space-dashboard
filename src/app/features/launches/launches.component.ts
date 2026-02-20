import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of, map } from 'rxjs';

interface Launch {
  id: string;
  name: string;
  status: { id: number; name: string; abbrev: string };
  net: string;
  window_start: string;
  window_end: string;
  launch_service_provider: { name: string; type: string } | null;
  rocket: { configuration: { full_name: string } } | null;
  mission: { name: string; description: string; orbit: { name: string } | null } | null;
  pad: { name: string; location: { name: string } } | null;
  image: string | null;
}

interface LaunchResponse {
  count: number;
  results: Launch[];
}

@Component({
  selector: 'app-launches',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe],
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <h1 class="page-title">Launch Calendar</h1>
        <p class="page-sub">Upcoming rocket launches worldwide</p>
      </div>

      <div class="filter-row">
        <button class="filter-btn" [class.active]="view() === 'upcoming'" (click)="view.set('upcoming')">
          Upcoming ({{ launches().length }})
        </button>
        <button class="filter-btn" [class.active]="view() === 'week'" (click)="view.set('week')">This Week</button>
        <button class="filter-btn" [class.active]="view() === 'month'" (click)="view.set('month')">This Month</button>
      </div>

      @if (loading()) {
        <div class="glass-card skeleton" style="height: 400px"></div>
      } @else {
        <div class="launch-list">
          @for (launch of filtered(); track launch.id) {
            <div class="glass-card launch-card">
              <div class="launch-header">
                <div class="launch-date-block">
                  <span class="launch-month">{{ formatMonth(launch.net) }}</span>
                  <span class="launch-day">{{ formatDay(launch.net) }}</span>
                  <span class="launch-time">{{ formatTime(launch.net) }} UTC</span>
                </div>
                <div class="launch-info">
                  <h3 class="launch-name">{{ launch.name }}</h3>
                  <div class="launch-meta">
                    @if (launch.launch_service_provider) {
                      <span class="launch-provider">{{ launch.launch_service_provider.name }}</span>
                    }
                    @if (launch.rocket) {
                      <span class="launch-rocket">{{ launch.rocket.configuration.full_name }}</span>
                    }
                  </div>
                  @if (launch.mission) {
                    <p class="launch-desc">{{ launch.mission.description | slice:0:200 }}{{ (launch.mission.description.length) > 200 ? '...' : '' }}</p>
                  }
                  <div class="launch-details">
                    <span class="launch-status" [class]="'status-' + statusClass(launch)">{{ launch.status.abbrev }}</span>
                    @if (launch.pad) {
                      <span class="launch-pad">{{ launch.pad.location.name }}</span>
                    }
                    @if (launch.mission?.orbit; as orbit) {
                      <span class="launch-orbit">{{ orbit.name }}</span>
                    }
                  </div>
                </div>
                <div class="launch-countdown">
                  <span class="countdown-label">T-minus</span>
                  <span class="countdown-value text-mono">{{ getCountdown(launch.net) }}</span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="glass-card empty-state">
              <p>No launches found for this period.</p>
            </div>
          }
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
      font-size: 0.875rem; font-weight: 500; transition: all 0.2s;
    }
    .filter-btn.active { background: var(--accent-nebula-dim); color: var(--accent-nebula); border-color: var(--accent-nebula); }
    .filter-btn:hover:not(.active) { background: var(--bg-hover); }
    .launch-list { display: flex; flex-direction: column; gap: var(--space-md); }
    .launch-card { padding: var(--space-lg); }
    .launch-header { display: grid; grid-template-columns: auto 1fr auto; gap: var(--space-lg); align-items: start; }
    .launch-date-block {
      display: flex; flex-direction: column; align-items: center;
      min-width: 56px; padding: var(--space-sm);
      background: var(--accent-nebula-dim); border-radius: var(--radius);
    }
    .launch-month { font-size: 0.875rem; font-weight: 600; text-transform: uppercase; color: var(--accent-nebula); letter-spacing: 0.05em; }
    .launch-day { font-size: 1.5rem; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary); line-height: 1.2; }
    .launch-time { font-size: 0.875rem; color: var(--text-tertiary); font-family: var(--font-mono); }
    .launch-info { display: flex; flex-direction: column; gap: var(--space-xs); min-width: 0; }
    .launch-name { font-size: 1rem; font-weight: 600; margin: 0; color: var(--text-primary); }
    .launch-meta { display: flex; gap: var(--space-sm); flex-wrap: wrap; font-size: 0.875rem; color: var(--text-secondary); }
    .launch-provider { font-weight: 500; }
    .launch-rocket { color: var(--accent-cyan); }
    .launch-desc { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin: var(--space-xs) 0 0; }
    .launch-details { display: flex; gap: var(--space-sm); flex-wrap: wrap; margin-top: var(--space-xs); }
    .launch-status {
      font-size: 0.75rem; font-weight: 600; padding: 2px 8px;
      border-radius: 4px; text-transform: uppercase;
    }
    .status-go { background: rgba(16,185,129,0.12); color: var(--status-safe); }
    .status-tbd { background: rgba(245,158,11,0.12); color: var(--status-warn); }
    .status-tbc { background: rgba(245,158,11,0.12); color: var(--status-warn); }
    .status-hold { background: rgba(239,68,68,0.12); color: var(--status-danger); }
    .launch-pad, .launch-orbit { font-size: 0.875rem; color: var(--text-tertiary); }
    .launch-countdown {
      display: flex; flex-direction: column; align-items: center;
      min-width: 80px; text-align: center;
    }
    .countdown-label { font-size: 0.875rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .countdown-value { font-size: 0.875rem; color: var(--accent-sun); font-weight: 600; }
    .text-mono { font-family: var(--font-mono); }
    .empty-state { text-align: center; padding: var(--space-2xl); color: var(--text-tertiary); }
    @media (max-width: 640px) {
      .launch-header { grid-template-columns: 1fr; }
      .launch-date-block { flex-direction: row; gap: var(--space-sm); justify-content: center; }
      .launch-countdown { flex-direction: row; gap: var(--space-sm); }
    }
  `],
})
export class LaunchesComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly launches = signal<Launch[]>([]);
  readonly loading = signal(true);
  readonly view = signal<'upcoming' | 'week' | 'month'>('upcoming');

  readonly filtered = computed(() => {
    const all = this.launches();
    const v = this.view();
    if (v === 'upcoming') return all;
    const now = new Date();
    if (v === 'week') {
      const end = new Date(now);
      end.setDate(end.getDate() + 7);
      return all.filter(l => new Date(l.net) <= end);
    }
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return all.filter(l => new Date(l.net) <= end);
  });

  ngOnInit(): void {
    this.http.get<LaunchResponse>('https://ll.thespacedevs.com/2.2.0/launch/upcoming/', {
      params: { limit: '30', mode: 'list' },
    }).pipe(
      map(res => res.results),
      catchError(() => of([])),
    ).subscribe(launches => {
      this.launches.set(launches);
      this.loading.set(false);
    });
  }

  formatMonth(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en', { month: 'short' });
  }

  formatDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  }

  statusClass(launch: Launch): string {
    const abbrev = launch.status.abbrev.toLowerCase();
    if (abbrev === 'go') return 'go';
    if (abbrev === 'hold' || abbrev === 'failure') return 'hold';
    return 'tbd';
  }

  getCountdown(dateStr: string): string {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return 'NOW';
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hrs}h`;
    return `${hrs}h ${min}m`;
  }
}
