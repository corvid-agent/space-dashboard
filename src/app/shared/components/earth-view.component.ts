import { Component, ChangeDetectionStrategy, input, inject } from '@angular/core';
import { EpicImage } from '../../core/models/nasa.model';
import { NasaService } from '../../core/services/nasa.service';

@Component({
  selector: 'app-earth-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="glass-card earth-card">
      <span class="section-label">Earth from DSCOVR — EPIC Camera</span>
      <div class="earth-grid">
        @for (img of images(); track img.identifier) {
          <div class="earth-item">
            <div class="earth-img-wrap">
              <img [src]="nasa.getEpicImageUrl(img)" [alt]="img.caption" loading="lazy" class="earth-img" (error)="onImgError($event)"/>
            </div>
            <span class="earth-date">{{ formatDate(img.date) }}</span>
          </div>
        }
      </div>
      @if (images().length === 0) {
        <p class="no-data">No EPIC images available.</p>
      }
    </div>
  `,
  styles: [`
    .earth-card { display: flex; flex-direction: column; gap: var(--space-md); }
    .earth-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--space-sm);
    }
    .earth-item { display: flex; flex-direction: column; gap: var(--space-xs); }
    .earth-img-wrap {
      aspect-ratio: 1; border-radius: 50%; overflow: hidden;
      background: var(--bg-surface);
      border: 2px solid var(--border);
      transition: border-color 0.3s;
    }
    .earth-img-wrap:hover { border-color: var(--accent-earth); }
    .earth-img { width: 100%; height: 100%; object-fit: cover; }
    .earth-date { font-size: 0.7rem; color: var(--text-tertiary); text-align: center; }
    .no-data { color: var(--text-tertiary); font-size: 0.9rem; }
    .img-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); color: var(--text-tertiary); font-size: 0.7rem;
    }
  `],
})
export class EarthViewComponent {
  readonly images = input.required<EpicImage[]>();
  protected readonly nasa = inject(NasaService);

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrap = img.parentElement;
    if (wrap && !wrap.querySelector('.img-fallback')) {
      const fb = document.createElement('div');
      fb.className = 'img-fallback';
      fb.textContent = 'N/A';
      wrap.appendChild(fb);
    }
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
