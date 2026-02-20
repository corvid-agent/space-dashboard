import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NasaService } from '../../core/services/nasa.service';
import { ApodResponse } from '../../core/models/nasa.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page container fade-in">
      <div class="page-header">
        <h1 class="page-title">APOD Gallery</h1>
        <p class="page-sub">Recent Astronomy Pictures of the Day</p>
      </div>

      @if (loading()) {
        <div class="gallery-grid">
          @for (i of skeletons; track i) {
            <div class="glass-card skeleton" style="aspect-ratio: 16/10"></div>
          }
        </div>
      } @else {
        <div class="gallery-grid">
          @for (item of gallery(); track item.date) {
            <div class="gallery-item glass-card" role="button" tabindex="0" (click)="activeItem.set(item)" (keydown.enter)="activeItem.set(item)" (keydown.space)="activeItem.set(item); $event.preventDefault()">
              @if (item.media_type === 'image') {
                <div class="item-image-wrap">
                  <img [src]="item.url" [alt]="item.title" loading="lazy" class="item-img" (error)="onImgError($event)"/>
                </div>
              } @else {
                <div class="item-video-wrap">
                  <div class="video-placeholder">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                  </div>
                </div>
              }
              <div class="item-info">
                <h3 class="item-title">{{ item.title }}</h3>
                <span class="item-date">{{ item.date }}</span>
                @if (item.copyright) {
                  <span class="item-credit">&copy; {{ item.copyright }}</span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Detail lightbox -->
      @if (activeItem()) {
        <div class="lightbox" role="dialog" aria-label="Image detail view" (click)="activeItem.set(null)">
          <div class="lightbox-content" (click)="$event.stopPropagation()">
            <button class="lightbox-close" aria-label="Close lightbox" (click)="activeItem.set(null)">&times;</button>
            @if (activeItem()!.media_type === 'image') {
              <img [src]="activeItem()!.hdurl || activeItem()!.url" [alt]="activeItem()!.title" class="lightbox-img" (error)="onImgError($event)"/>
            } @else {
              <iframe [src]="safeActiveVideoUrl()" class="lightbox-video" frameborder="0" allowfullscreen></iframe>
            }
            <div class="lightbox-info">
              <h2>{{ activeItem()!.title }}</h2>
              <span class="lightbox-date">{{ activeItem()!.date }}</span>
              <p class="lightbox-desc">{{ activeItem()!.explanation }}</p>
              @if (activeItem()!.copyright) {
                <span class="lightbox-credit">&copy; {{ activeItem()!.copyright }}</span>
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
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-lg);
    }
    .gallery-item {
      padding: 0; overflow: hidden; cursor: pointer;
      transition: transform 0.2s, border-color 0.3s;
    }
    .gallery-item:hover { transform: translateY(-3px); border-color: var(--accent-nebula); }
    .item-image-wrap { aspect-ratio: 16/10; overflow: hidden; background: var(--bg-surface); }
    .item-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
    .gallery-item:hover .item-img { transform: scale(1.05); }
    .item-video-wrap { aspect-ratio: 16/10; }
    .video-placeholder {
      width: 100%; height: 100%; display: flex;
      align-items: center; justify-content: center;
      background: var(--bg-surface); color: var(--accent-nebula);
    }
    .item-info { padding: var(--space-md); display: flex; flex-direction: column; gap: var(--space-xs); }
    .item-title { font-size: 1rem; font-weight: 600; line-height: 1.3; }
    .item-date { font-size: 0.875rem; color: var(--text-tertiary); font-family: var(--font-mono); }
    .item-credit { font-size: 0.875rem; color: var(--text-tertiary); }
    .img-fallback {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); color: var(--text-tertiary);
    }

    .lightbox {
      position: fixed; inset: 0; z-index: 100;
      background: var(--bg-deep, #000);
      display: flex; align-items: flex-start; justify-content: center;
      padding: var(--space-xl); overflow-y: auto;
    }
    .lightbox-content { max-width: 900px; width: 100%; position: relative; }
    .lightbox-close {
      position: absolute; top: -48px; right: 0; font-size: 2rem; color: var(--text-secondary); z-index: 1;
      min-width: 44px; min-height: 44px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .lightbox-img { width: 100%; border-radius: var(--radius); }
    .lightbox-video { width: 100%; aspect-ratio: 16/9; border-radius: var(--radius); }
    .lightbox-info { padding: var(--space-lg) 0; display: flex; flex-direction: column; gap: var(--space-sm); }
    .lightbox-info h2 { font-family: var(--font-heading); font-size: 1.4rem; }
    .lightbox-date { font-size: 0.875rem; color: var(--accent-nebula); font-family: var(--font-mono); }
    .lightbox-desc { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.7; }
    .lightbox-credit { font-size: 0.875rem; color: var(--text-tertiary); }

    @media (max-width: 640px) {
      .gallery-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class GalleryComponent implements OnInit {
  private readonly nasa = inject(NasaService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly gallery = signal<ApodResponse[]>([]);
  readonly loading = signal(true);
  readonly activeItem = signal<ApodResponse | null>(null);
  readonly skeletons = Array.from({ length: 6 }, (_, i) => i);

  readonly safeActiveVideoUrl = computed(() => {
    const item = this.activeItem();
    return item ? this.sanitizer.bypassSecurityTrustResourceUrl(item.url) : null;
  });

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const wrap = img.parentElement;
    if (wrap && !wrap.querySelector('.img-fallback')) {
      const fb = document.createElement('div');
      fb.className = 'img-fallback';
      fb.innerHTML = '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
      wrap.appendChild(fb);
    }
  }

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 11);

    this.nasa.loadApodRange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0],
    ).subscribe({
      next: items => {
        this.gallery.set(items.reverse());
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
