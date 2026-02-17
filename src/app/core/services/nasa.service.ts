import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import {
  ApodResponse, NeoFeed, NasaImageSearchResponse, SpacePhoto,
  EpicImage, SolarFlare, CoronalMassEjection, GeomagneticStorm,
  IssPosition, PeopleInSpace,
} from '../models/nasa.model';

const NASA_API = 'https://api.nasa.gov';
const NASA_IMAGES_API = 'https://images-api.nasa.gov';
const API_KEY = 'DEMO_KEY';

@Injectable({ providedIn: 'root' })
export class NasaService {
  private readonly http = inject(HttpClient);

  /** Astronomy Picture of the Day */
  loadApod(): Observable<ApodResponse> {
    return this.http.get<ApodResponse>(`${NASA_API}/planetary/apod`, {
      params: { api_key: API_KEY },
    });
  }

  /** APOD gallery — date range */
  loadApodRange(startDate: string, endDate: string): Observable<ApodResponse[]> {
    return this.http.get<ApodResponse[]>(`${NASA_API}/planetary/apod`, {
      params: { start_date: startDate, end_date: endDate, api_key: API_KEY },
    });
  }

  /** Near-Earth Objects — today + next 2 days */
  loadNeoFeed(): Observable<NeoFeed> {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 2);
    return this.http.get<NeoFeed>(`${NASA_API}/neo/rest/v1/feed`, {
      params: {
        start_date: formatDate(today),
        end_date: formatDate(end),
        api_key: API_KEY,
      },
    });
  }

  /** Mars Rover Photos — via NASA Image Library API */
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
          // Build larger image URL from thumbnail pattern
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
    return this.http.get<EpicImage[]>(
      `${NASA_API}/EPIC/api/natural/images`,
      { params: { api_key: API_KEY } },
    ).pipe(
      map(images => images.slice(0, 6)),
      catchError(() => of([])),
    );
  }

  /** Build EPIC image URL */
  getEpicImageUrl(image: EpicImage): string {
    const d = new Date(image.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${NASA_API}/EPIC/archive/natural/${year}/${month}/${day}/png/${image.image}.png?api_key=${API_KEY}`;
  }

  /** Solar Flares — last 30 days */
  loadSolarFlares(): Observable<SolarFlare[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.http.get<SolarFlare[]>(`${NASA_API}/DONKI/FLR`, {
      params: { startDate: formatDate(start), endDate: formatDate(end), api_key: API_KEY },
    }).pipe(catchError(() => of([])));
  }

  /** Coronal Mass Ejections — last 30 days */
  loadCMEs(): Observable<CoronalMassEjection[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.http.get<CoronalMassEjection[]>(`${NASA_API}/DONKI/CME`, {
      params: { startDate: formatDate(start), endDate: formatDate(end), api_key: API_KEY },
    }).pipe(catchError(() => of([])));
  }

  /** Geomagnetic Storms — last 30 days */
  loadGeomagneticStorms(): Observable<GeomagneticStorm[]> {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);
    return this.http.get<GeomagneticStorm[]>(`${NASA_API}/DONKI/GST`, {
      params: { startDate: formatDate(start), endDate: formatDate(end), api_key: API_KEY },
    }).pipe(catchError(() => of([])));
  }

  /** ISS current position */
  loadIssPosition(): Observable<IssPosition> {
    return this.http.get<IssPosition>('http://api.open-notify.org/iss-now.json');
  }

  /** People currently in space */
  loadPeopleInSpace(): Observable<PeopleInSpace> {
    return this.http.get<PeopleInSpace>('http://api.open-notify.org/astros.json');
  }
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
