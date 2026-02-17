import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { IssPosition, PeopleInSpace } from '../../core/models/nasa.model';

@Component({
  selector: 'app-iss-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card iss-card">
      <div class="iss-header">
        <span class="section-label">ISS Tracker</span>
        <span class="iss-live">LIVE</span>
      </div>
      <div class="iss-map">
        <svg viewBox="0 0 360 180" class="map-svg">
          <!-- Simple world outline -->
          <rect width="360" height="180" fill="rgba(10,10,30,0.5)" rx="4"/>
          <!-- Grid lines -->
          @for (x of gridX; track x) {
            <line [attr.x1]="x" y1="0" [attr.x2]="x" y2="180" stroke="var(--border)" stroke-width="0.3"/>
          }
          @for (y of gridY; track y) {
            <line x1="0" [attr.y1]="y" x2="360" [attr.y2]="y" stroke="var(--border)" stroke-width="0.3"/>
          }
          <!-- Equator -->
          <line x1="0" y1="90" x2="360" y2="90" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4 4"/>
          <!-- ISS position -->
          <circle [attr.cx]="mapX()" [attr.cy]="mapY()" r="4" fill="var(--accent-cyan)" class="iss-dot"/>
          <circle [attr.cx]="mapX()" [attr.cy]="mapY()" r="8" fill="none" stroke="var(--accent-cyan)" stroke-width="1" opacity="0.4" class="iss-pulse"/>
          <!-- ISS label -->
          <text [attr.x]="mapX() + 10" [attr.y]="mapY() + 4" fill="var(--accent-cyan)" font-size="8" font-weight="600">ISS</text>
        </svg>
      </div>
      <div class="iss-info">
        <div class="iss-coord">
          <span class="coord-label">Lat</span>
          <span class="coord-value">{{ lat() }}°</span>
        </div>
        <div class="iss-coord">
          <span class="coord-label">Lon</span>
          <span class="coord-value">{{ lon() }}°</span>
        </div>
        <div class="iss-coord">
          <span class="coord-label">Speed</span>
          <span class="coord-value">27,600 km/h</span>
        </div>
      </div>
      @if (people()) {
        <div class="crew-section">
          <span class="crew-count">{{ people()!.number }} humans in space</span>
          <div class="crew-list">
            @for (p of people()!.people; track p.name) {
              <div class="crew-member">
                <span class="crew-name">{{ p.name }}</span>
                <span class="crew-craft">{{ p.craft }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .iss-card { display: flex; flex-direction: column; gap: var(--space-md); }
    .iss-header { display: flex; justify-content: space-between; align-items: center; }
    .iss-live {
      font-size: 0.65rem; font-weight: 700; padding: 2px 8px;
      background: rgba(0, 212, 255, 0.15); color: var(--accent-cyan);
      border-radius: 4px; letter-spacing: 0.1em;
      animation: blink 2s ease-in-out infinite;
    }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .iss-map { border-radius: var(--radius); overflow: hidden; }
    .map-svg { width: 100%; display: block; }
    .iss-dot { filter: drop-shadow(0 0 4px var(--accent-cyan)); }
    .iss-pulse { animation: pulse 2s ease-out infinite; }
    @keyframes pulse { 0% { r: 4; opacity: 0.6; } 100% { r: 16; opacity: 0; } }
    .iss-info { display: flex; gap: var(--space-lg); }
    .iss-coord { display: flex; flex-direction: column; gap: 2px; }
    .coord-label { font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .coord-value { font-family: var(--font-mono); font-size: 0.9rem; font-weight: 600; }
    .crew-section { display: flex; flex-direction: column; gap: var(--space-sm); border-top: 1px solid var(--border); padding-top: var(--space-md); }
    .crew-count { font-size: 0.85rem; font-weight: 600; color: var(--accent-cyan); }
    .crew-list { display: flex; flex-wrap: wrap; gap: var(--space-sm); }
    .crew-member { display: flex; flex-direction: column; gap: 1px; padding: var(--space-xs) var(--space-sm); background: rgba(10,10,30,0.4); border-radius: var(--radius); }
    .crew-name { font-size: 0.8rem; font-weight: 500; }
    .crew-craft { font-size: 0.7rem; color: var(--text-tertiary); }
  `],
})
export class IssTrackerComponent {
  readonly position = input.required<IssPosition>();
  readonly people = input<PeopleInSpace | null>(null);

  readonly gridX = [60, 120, 180, 240, 300];
  readonly gridY = [30, 60, 90, 120, 150];

  readonly lat = computed(() => parseFloat(this.position().iss_position.latitude).toFixed(2));
  readonly lon = computed(() => parseFloat(this.position().iss_position.longitude).toFixed(2));

  readonly mapX = computed(() => {
    const lon = parseFloat(this.position().iss_position.longitude);
    return ((lon + 180) / 360) * 360;
  });

  readonly mapY = computed(() => {
    const lat = parseFloat(this.position().iss_position.latitude);
    return ((90 - lat) / 180) * 180;
  });
}
