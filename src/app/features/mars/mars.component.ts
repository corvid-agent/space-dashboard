import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { NasaService } from '../../core/services/nasa.service';
import { MarsPhoto } from '../../core/models/nasa.model';
import { MarsGalleryComponent } from '../../shared/components/mars-gallery.component';

@Component({
  selector: 'app-mars',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarsGalleryComponent],
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <h1 class="page-title">Mars Rover Gallery</h1>
        <p class="page-sub">Photos from NASA's Mars rovers</p>
      </div>

      <!-- Rover selector -->
      <div class="rover-controls">
        <div class="rover-tabs">
          <button class="rover-tab" [class.active]="selectedRover() === 'curiosity'" (click)="selectRover('curiosity')">
            Curiosity
          </button>
          <button class="rover-tab" [class.active]="selectedRover() === 'perseverance'" (click)="selectRover('perseverance')">
            Perseverance
          </button>
          <button class="rover-tab" [class.active]="selectedRover() === 'opportunity'" (click)="selectRover('opportunity')">
            Opportunity
          </button>
        </div>
        <div class="sol-control">
          <label class="sol-label">Sol:</label>
          <input type="number" class="sol-input" [value]="sol()" min="1" (change)="onSolChange($event)"/>
          <button class="btn-secondary" (click)="loadPhotos()">Load</button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-grid">
          @for (i of skeletons; track i) {
            <div class="glass-card skeleton" style="aspect-ratio: 4/3"></div>
          }
        </div>
      } @else if (photos().length > 0) {
        <app-mars-gallery [photos]="photos()" (photoSelected)="openPhoto($event)" />
      } @else {
        <div class="glass-card empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="var(--accent-mars)" stroke-width="1.5" opacity="0.5">
            <circle cx="12" cy="12" r="10"/><path d="M8 12a4 4 0 018 0"/>
          </svg>
          <p>No photos found for Sol {{ sol() }}. Try a different sol number.</p>
        </div>
      }

      <!-- Photo lightbox -->
      @if (activePhoto()) {
        <div class="lightbox" (click)="activePhoto.set(null)">
          <div class="lightbox-content" (click)="$event.stopPropagation()">
            <button class="lightbox-close" (click)="activePhoto.set(null)">×</button>
            <img [src]="activePhoto()!.img_src" [alt]="activePhoto()!.camera.full_name" class="lightbox-img"/>
            <div class="lightbox-info">
              <h3>{{ activePhoto()!.camera.full_name }}</h3>
              <p>{{ activePhoto()!.rover.name }} · Sol {{ activePhoto()!.sol }} · {{ activePhoto()!.earth_date }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding-top: var(--space-xl); padding-bottom: var(--space-2xl); display: flex; flex-direction: column; gap: var(--space-xl); }
    .page-title { font-family: var(--font-heading); font-size: 2rem; font-weight: 700; margin: 0; }
    .page-sub { color: var(--text-secondary); font-size: 0.95rem; }
    .page-header { display: flex; flex-direction: column; gap: var(--space-xs); }
    .rover-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-md); }
    .rover-tabs { display: flex; gap: var(--space-xs); }
    .rover-tab {
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--radius); background: var(--bg-card);
      border: 1px solid var(--border); color: var(--text-secondary);
      font-size: 0.85rem; font-weight: 500; transition: all 0.2s;
    }
    .rover-tab.active { background: var(--accent-mars-dim); color: var(--accent-mars); border-color: var(--accent-mars); }
    .rover-tab:hover:not(.active) { background: var(--bg-hover); }
    .sol-control { display: flex; align-items: center; gap: var(--space-sm); }
    .sol-label { font-size: 0.85rem; color: var(--text-secondary); }
    .sol-input {
      width: 80px; padding: var(--space-sm);
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: var(--radius); color: var(--text-primary);
      font-family: var(--font-mono); font-size: 0.85rem;
    }
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-md);
    }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-md); padding: var(--space-2xl);
      text-align: center; color: var(--text-tertiary);
    }
    .lightbox {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0, 0, 0, 0.9);
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-lg);
    }
    .lightbox-content { max-width: 900px; width: 100%; position: relative; }
    .lightbox-close {
      position: absolute; top: -40px; right: 0;
      font-size: 2rem; color: var(--text-secondary);
    }
    .lightbox-img { width: 100%; border-radius: var(--radius); }
    .lightbox-info { padding: var(--space-md) 0; }
    .lightbox-info h3 { font-size: 1.1rem; font-weight: 600; color: var(--accent-mars); }
    .lightbox-info p { font-size: 0.85rem; color: var(--text-secondary); margin-top: var(--space-xs); }
  `],
})
export class MarsComponent implements OnInit {
  private readonly nasa = inject(NasaService);

  readonly selectedRover = signal('curiosity');
  readonly sol = signal(1000);
  readonly photos = signal<MarsPhoto[]>([]);
  readonly loading = signal(false);
  readonly activePhoto = signal<MarsPhoto | null>(null);
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit(): void {
    this.loadPhotos();
  }

  selectRover(rover: string): void {
    this.selectedRover.set(rover);
    const defaults: Record<string, number> = { curiosity: 1000, perseverance: 100, opportunity: 5000 };
    this.sol.set(defaults[rover] || 1000);
    this.loadPhotos();
  }

  onSolChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (val > 0) this.sol.set(val);
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.nasa.loadMarsPhotos(this.selectedRover(), this.sol()).subscribe({
      next: photos => {
        this.photos.set(photos);
        this.loading.set(false);
      },
      error: () => {
        this.photos.set([]);
        this.loading.set(false);
      },
    });
  }

  openPhoto(photo: MarsPhoto): void {
    this.activePhoto.set(photo);
  }
}
