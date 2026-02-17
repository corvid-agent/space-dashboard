import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { SpacePhoto } from '../../core/models/nasa.model';

@Component({
  selector: 'app-mars-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gallery-grid">
      @for (photo of photos(); track photo.id) {
        <div class="photo-card glass-card" (click)="photoSelected.emit(photo)">
          <div class="photo-wrap">
            <img [src]="photo.thumbnailUrl" [alt]="photo.title" loading="lazy" class="photo-img" (error)="onImgError($event)"/>
          </div>
          <div class="photo-info">
            <span class="photo-title">{{ photo.title }}</span>
            <span class="photo-date">{{ photo.date }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--space-md);
    }
    .photo-card {
      padding: 0; overflow: hidden; cursor: pointer;
      transition: transform 0.2s, border-color 0.3s;
    }
    .photo-card:hover { transform: translateY(-2px); border-color: var(--accent-mars); }
    .photo-wrap { aspect-ratio: 4/3; overflow: hidden; background: var(--bg-surface); }
    .photo-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .photo-card:hover .photo-img { transform: scale(1.05); }
    .photo-info { padding: var(--space-sm) var(--space-md); display: flex; flex-direction: column; gap: 2px; }
    .photo-title { font-size: 0.8rem; font-weight: 600; color: var(--accent-mars); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .photo-date { font-size: 0.75rem; color: var(--text-tertiary); }
    .img-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); color: var(--text-tertiary);
    }
  `],
})
export class MarsGalleryComponent {
  readonly photos = input.required<SpacePhoto[]>();
  readonly photoSelected = output<SpacePhoto>();

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrap = img.parentElement;
    if (wrap && !wrap.querySelector('.img-fallback')) {
      const fb = document.createElement('div');
      fb.className = 'img-fallback';
      fb.textContent = 'Image unavailable';
      wrap.appendChild(fb);
    }
  }
}
