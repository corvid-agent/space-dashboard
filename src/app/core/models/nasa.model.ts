/** Astronomy Picture of the Day */
export interface ApodResponse {
  date: string;
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  copyright?: string;
  thumbnail_url?: string;
}

/** Near-Earth Object */
export interface NeoFeed {
  element_count: number;
  near_earth_objects: Record<string, NeoObject[]>;
}

export interface NeoObject {
  id: string;
  name: string;
  nasa_jpl_url: string;
  absolute_magnitude_h: number;
  estimated_diameter: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
    kilometers: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    };
  };
  is_potentially_hazardous_asteroid: boolean;
  close_approach_data: CloseApproach[];
}

export interface CloseApproach {
  close_approach_date: string;
  close_approach_date_full: string;
  epoch_date_close_approach: number;
  relative_velocity: {
    kilometers_per_second: string;
    kilometers_per_hour: string;
    miles_per_hour: string;
  };
  miss_distance: {
    astronomical: string;
    lunar: string;
    kilometers: string;
    miles: string;
  };
  orbiting_body: string;
}

/** NASA Image Library search result */
export interface NasaImageSearchResponse {
  collection: {
    items: NasaImageItem[];
    metadata: { total_hits: number };
  };
}

export interface NasaImageItem {
  data: NasaImageData[];
  links?: NasaImageLink[];
  href: string;
}

export interface NasaImageData {
  nasa_id: string;
  title: string;
  description?: string;
  date_created: string;
  center?: string;
  keywords?: string[];
}

export interface NasaImageLink {
  href: string;
  rel: string;
  render?: string;
}

/** Flattened Mars/space photo for display */
export interface SpacePhoto {
  id: string;
  title: string;
  description: string;
  date: string;
  thumbnailUrl: string;
  fullUrl: string;
  center?: string;
}

/** EPIC — Earth Polychromatic Imaging Camera */
export interface EpicImage {
  identifier: string;
  caption: string;
  image: string;
  date: string;
  centroid_coordinates: {
    lat: number;
    lon: number;
  };
}

/** DONKI — Space Weather */
export interface SolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  endTime: string | null;
  classType: string;
  sourceLocation: string;
  activeRegionNum: number | null;
  linkedEvents: LinkedEvent[] | null;
}

export interface CoronalMassEjection {
  activityID: string;
  startTime: string;
  sourceLocation: string;
  activeRegionNum: number | null;
  note: string;
  linkedEvents: LinkedEvent[] | null;
}

export interface GeomagneticStorm {
  gstID: string;
  startTime: string;
  kpIndex: number | null;
  linkedEvents: LinkedEvent[] | null;
}

export interface LinkedEvent {
  activityID: string;
}

/** ISS Position (Open Notify API) */
export interface IssPosition {
  timestamp: number;
  iss_position: {
    latitude: string;
    longitude: string;
  };
  message: string;
}

/** People in Space */
export interface PeopleInSpace {
  number: number;
  people: { name: string; craft: string }[];
  message: string;
}
