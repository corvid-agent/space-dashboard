import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of, shareReplay, tap } from 'rxjs';
import {
  ApodResponse, NeoFeed, NasaImageSearchResponse, SpacePhoto,
  EpicImage, SolarFlare, CoronalMassEjection, GeomagneticStorm,
  IssPosition, PeopleInSpace,
} from '../models/nasa.model';
import { NASA_API_KEY, NASA_API, NASA_IMAGES_API, ISS_API } from '../config/api.config';

/** Simple in-memory cache entry */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class NasaService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  /** Cache duration: 10 minutes for most data */
  private readonly CACHE_TTL = 10 * 60 * 1000;

  /** Astronomy Picture of the Day */
  loadApod(): Observable<ApodResponse> {
    return this.cached('apod', () =>
      this.http.get<ApodResponse>(`${NASA_API}/planetary/apod`, {
        params: { api_key: NASA_API_KEY },
      })
    );
  }

  /** APOD gallery — date range */
  loadApodRange(startDate: string, endDate: string): Observable<ApodResponse[]> {
    return this.cached(`apod-range-${startDate}`, () =>
      this.http.get<ApodResponse[]>(`${NASA_API}/planetary/apod`, {
        params: { start_date: startDate, end_date: endDate, api_key: NASA_API_KEY },
      })
    );
  }

  /** Near-Earth Objects — today + next 2 days */
  loadNeoFeed(): Observable<NeoFeed> {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 2);
    const key = `neo-${formatDate(today)}`;
    return this.cached(key, () =>
      this.http.get<NeoFeed>(`${NASA_API}/neo/rest/v1/feed`, {
        params: {
          start_date: formatDate(today),
          end_date: formatDate(end),
          api_key: NASA_API_KEY,
        },
      })
    );
  }

  /** Mars Rover Photos — via NASA Image Library API (no API key needed) */
  loadMarsPhotos(rover = 'curiosity', page = 1): Observable<SpacePhoto[]> {
    return this.http.get<NasaImageSearchResponse>(`${NASA_IMAGES_API}/search`, {
      params: {
        q: `${rover} rover mars surface`,
        media_type: 'image',
        page_size: '24',
        page: page.toString(),
      },
    }).pipe(
      map(res => res.collection.items
        .filter(item => item.links && item.links.length > 0)
        .map(item => {
          const data = item.data[0];
          const thumb = item.links?.[0]?.href || '';
          const fullUrl = thumb.replace('~small', '~medium').replace('~thumb', '~medium');
          return {
            id: data.nasa_id,
            title: data.title,
            description: data.description || '',
            date: data.date_created?.split('T')[0] || '',
            thumbnailUrl: thumb,
            fullUrl,
            center: data.center,
          } as SpacePhoto;
        })
      ),
      catchError(() => of([])),
    );
  }

  /** EPIC — latest Earth images */
  loadEpicImages(): Observable<EpicImage[]> {
    return this.cached('epic', () =>
      this.http.get<EpicImage[]>(
        `${NASA_API}/EPIC/api/natural/images`,
        { params: { api_key: NASA_API_KEY } },
      ).pipe(map(images => images.slice(0, 6)))
    ).pipe(catchError(() => of([])));
  }

  /** Build EPIC image URL */
  getEpicImageUrl(image: EpicImage): string {
    const d = new Date(image.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${NASA_API}/EPIC/archive/natural/${year}/${month}/${day}/png/${image.image}.png?api_key=${NASA_API_KEY}`;
  }

  /** Solar Flares — last 30 days */
  loadSolarFlares(): Observable<SolarFlare[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.cached('flares', () =>
      this.http.get<SolarFlare[]>(`${NASA_API}/DONKI/FLR`, {
        params: { startDate: formatDate(start), endDate: formatDate(end), api_key: NASA_API_KEY },
      })
    ).pipe(catchError(() => of([])));
  }

  /** Coronal Mass Ejections — last 30 days */
  loadCMEs(): Observable<CoronalMassEjection[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.cached('cmes', () =>
      this.http.get<CoronalMassEjection[]>(`${NASA_API}/DONKI/CME`, {
        params: { startDate: formatDate(start), endDate: formatDate(end), api_key: NASA_API_KEY },
      })
    ).pipe(catchError(() => of([])));
  }

  /** Geomagnetic Storms — last 30 days */
  loadGeomagneticStorms(): Observable<GeomagneticStorm[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.cached('storms', () =>
      this.http.get<GeomagneticStorm[]>(`${NASA_API}/DONKI/GST`, {
        params: { startDate: formatDate(start), endDate: formatDate(end), api_key: NASA_API_KEY },
      })
    ).pipe(catchError(() => of([])));
  }

  /** ISS current position (HTTPS via api.wheretheiss.at) */
  loadIssPosition(): Observable<IssPosition> {
    return this.http.get<WhereTheIssResponse>(ISS_API).pipe(
      map(res => ({
        timestamp: res.timestamp,
        iss_position: {
          latitude: String(res.latitude),
          longitude: String(res.longitude),
        },
        velocity: res.velocity,
        altitude: res.altitude,
      })),
    );
  }

  /** People currently in space — fallback to empty if unavailable (HTTP-only API) */
  loadPeopleInSpace(): Observable<PeopleInSpace> {
    return this.http.get<PeopleInSpace>('http://api.open-notify.org/astros.json').pipe(
      catchError(() => of({ number: 0, people: [], message: 'unavailable' })),
    );
  }

  /** Generic in-memory cache wrapper */
  private cached<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return of(entry.data);
    }
    return factory().pipe(
      tap(data => this.cache.set(key, { data, timestamp: Date.now() })),
    );
  }
}

/** Raw response from api.wheretheiss.at */
interface WhereTheIssResponse {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
