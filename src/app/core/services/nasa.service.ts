import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import {
  ApodResponse, NeoFeed, MarsRoverResponse, MarsPhoto,
  EpicImage, SolarFlare, CoronalMassEjection, GeomagneticStorm,
  IssPosition, PeopleInSpace,
} from '../models/nasa.model';

const NASA_API = 'https://api.nasa.gov';
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

  /** Mars Rover Photos — latest from Curiosity */
  loadMarsPhotos(rover = 'curiosity', sol?: number): Observable<MarsPhoto[]> {
    const params: Record<string, string> = { api_key: API_KEY };
    if (sol != null) {
      params['sol'] = sol.toString();
    } else {
      params['sol'] = '1000';
    }
    return this.http.get<MarsRoverResponse>(
      `${NASA_API}/mars-photos/api/v1/rovers/${rover}/photos`,
      { params },
    ).pipe(map(r => r.photos.slice(0, 24)));
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
