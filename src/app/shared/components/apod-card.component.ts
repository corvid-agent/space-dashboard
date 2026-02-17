import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SlicePipe } from '@angular/common';
import { ApodResponse } from '../../core/models/nasa.model';

@Component({
  selector: 'app-apod-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe],
  template: `
    <div class="glass-card apod-card">
      <div class="apod-header">
        <span class="section-label">Astronomy Picture of the Day</span>
        <span class="apod-date">{{ apod().date }}</span>
      </div>
      @if (apod().media_type === 'image') {
        <div class="apod-image-wrap">
          <img [src]="apod().url" [alt]="apod().title" loading="lazy" class="apod-img" (error)="onImgError($event)"/>
        </div>
      } @else {
        <div class="apod-video-wrap">
          <iframe [src]="safeVideoUrl()" frameborder="0" allowfullscreen class="apod-video"></iframe>
        </div>
      }
      <h2 class="apod-title">{{ apod().title }}</h2>
      <p class="apod-desc">{{ apod().explanation | slice:0:280 }}{{ apod().explanation.length > 280 ? '...' : '' }}</p>
      @if (apod().copyright) {
        <span class="apod-credit">&copy; {{ apod().copyright }}</span>
      }
    </div>
  `,
  styles: [`
    .apod-card { display: flex; flex-direction: column; gap: var(--space-md); overflow: hidden; }
    .apod-header { display: flex; justify-content: space-between; align-items: center; }
    .apod-date { font-size: 0.8rem; color: var(--text-tertiary); font-family: var(--font-mono); }
    .apod-image-wrap {
      border-radius: var(--radius); overflow: hidden;
      aspect-ratio: 16/9; background: var(--bg-surface);
    }
    .apod-img { width: 100%; height: 100%; object-fit: cover; }
    .apod-video-wrap { aspect-ratio: 16/9; border-radius: var(--radius); overflow: hidden; }
    .apod-video { width: 100%; height: 100%; }
    .apod-title { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 700; }
    .apod-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; }
    .apod-credit { font-size: 0.75rem; color: var(--text-tertiary); }
    .img-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); color: var(--text-tertiary); font-size: 0.85rem;
    }
  `],
})
export class ApodCardComponent {
  private readonly sanitizer = inject(DomSanitizer);
  readonly apod = input.required<ApodResponse>();
  readonly safeVideoUrl = computed(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.apod().url)
  );

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
