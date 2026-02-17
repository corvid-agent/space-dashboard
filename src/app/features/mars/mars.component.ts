import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { NasaService } from '../../core/services/nasa.service';
import { SpacePhoto } from '../../core/models/nasa.model';
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
        @if (hasMore()) {
          <button class="btn-secondary" (click)="loadMore()">Load More</button>
        }
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
          <p>No photos found for this rover. Try another one.</p>
        </div>
      }

      <!-- Photo lightbox -->
      @if (activePhoto()) {
        <div class="lightbox" (click)="activePhoto.set(null)">
          <div class="lightbox-content" (click)="$event.stopPropagation()">
            <button class="lightbox-close" (click)="activePhoto.set(null)">&times;</button>
            <img [src]="activePhoto()!.fullUrl" [alt]="activePhoto()!.title" class="lightbox-img"/>
            <div class="lightbox-info">
              <h3>{{ activePhoto()!.title }}</h3>
              <p class="lightbox-date">{{ activePhoto()!.date }}</p>
              @if (activePhoto()!.description) {
                <p class="lightbox-desc">{{ activePhoto()!.description }}</p>
              }
              @if (activePhoto()!.center) {
                <span class="lightbox-credit">{{ activePhoto()!.center }}</span>
              }
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
      display: flex; align-items: flex-start; justify-content: center;
      padding: var(--space-xl); overflow-y: auto;
    }
    .lightbox-content { max-width: 900px; width: 100%; position: relative; }
    .lightbox-close {
      position: absolute; top: -40px; right: 0;
      font-size: 2rem; color: var(--text-secondary);
    }
    .lightbox-img { width: 100%; border-radius: var(--radius); }
    .lightbox-info { padding: var(--space-md) 0; display: flex; flex-direction: column; gap: var(--space-sm); }
    .lightbox-info h3 { font-size: 1.1rem; font-weight: 600; color: var(--accent-mars); }
    .lightbox-date { font-size: 0.85rem; color: var(--accent-nebula); font-family: var(--font-mono); }
    .lightbox-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }
    .lightbox-credit { font-size: 0.8rem; color: var(--text-tertiary); }
  `],
})
export class MarsComponent implements OnInit {
  private readonly nasa = inject(NasaService);

  readonly selectedRover = signal('curiosity');
  readonly page = signal(1);
  readonly photos = signal<SpacePhoto[]>([]);
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  readonly activePhoto = signal<SpacePhoto | null>(null);
  readonly skeletons = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit(): void {
    this.loadPhotos();
  }

  selectRover(rover: string): void {
    this.selectedRover.set(rover);
    this.page.set(1);
    this.photos.set([]);
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.loading.set(true);
    this.nasa.loadMarsPhotos(this.selectedRover(), this.page()).subscribe({
      next: photos => {
        this.photos.set(photos);
        this.hasMore.set(photos.length >= 20);
        this.loading.set(false);
      },
      error: () => {
        this.photos.set([]);
        this.loading.set(false);
      },
    });
  }

  loadMore(): void {
    this.page.update(p => p + 1);
    this.loading.set(true);
    this.nasa.loadMarsPhotos(this.selectedRover(), this.page()).subscribe({
      next: newPhotos => {
        this.photos.update(existing => [...existing, ...newPhotos]);
        this.hasMore.set(newPhotos.length >= 20);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openPhoto(photo: SpacePhoto): void {
    this.activePhoto.set(photo);
  }
}
