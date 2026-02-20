import { Page } from '@playwright/test';

const APOD_MOCK = {
  date: '2026-02-19',
  title: 'Test Nebula',
  explanation: 'A beautiful test nebula in the cosmos.',
  url: 'https://apod.nasa.gov/apod/image/test.jpg',
  hdurl: 'https://apod.nasa.gov/apod/image/test_hd.jpg',
  media_type: 'image',
  copyright: 'Test Photographer',
};

const NEO_MOCK = {
  element_count: 5,
  near_earth_objects: {
    '2026-02-19': [
      {
        id: '1',
        name: '(2026 AB1)',
        nasa_jpl_url: 'https://test',
        absolute_magnitude_h: 22.5,
        is_potentially_hazardous_asteroid: false,
        estimated_diameter: {
          meters: { estimated_diameter_min: 50, estimated_diameter_max: 100 },
          kilometers: { estimated_diameter_min: 0.05, estimated_diameter_max: 0.1 },
        },
        close_approach_data: [
          {
            close_approach_date: '2026-02-19',
            close_approach_date_full: '2026-Feb-19 12:00',
            epoch_date_close_approach: 1771502400000,
            relative_velocity: {
              kilometers_per_second: '6.94',
              kilometers_per_hour: '25000',
              miles_per_hour: '15534',
            },
            miss_distance: {
              astronomical: '0.014',
              lunar: '5.5',
              kilometers: '2100000',
              miles: '1304622',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
      {
        id: '2',
        name: '(2026 CD2)',
        nasa_jpl_url: 'https://test',
        absolute_magnitude_h: 20.1,
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: { estimated_diameter_min: 200, estimated_diameter_max: 400 },
          kilometers: { estimated_diameter_min: 0.2, estimated_diameter_max: 0.4 },
        },
        close_approach_data: [
          {
            close_approach_date: '2026-02-19',
            close_approach_date_full: '2026-Feb-19 08:00',
            epoch_date_close_approach: 1771488000000,
            relative_velocity: {
              kilometers_per_second: '13.89',
              kilometers_per_hour: '50000',
              miles_per_hour: '31069',
            },
            miss_distance: {
              astronomical: '0.003',
              lunar: '1.2',
              kilometers: '460000',
              miles: '285833',
            },
            orbiting_body: 'Earth',
          },
        ],
      },
    ],
  },
};

export async function mockNasaAPIs(page: Page) {
  // APOD
  await page.route('**/api.nasa.gov/planetary/apod*', (route) => {
    const url = route.request().url();
    if (url.includes('start_date')) {
      // Gallery request - return array
      const items = Array.from({ length: 12 }, (_, i) => ({
        ...APOD_MOCK,
        date: `2026-02-${String(19 - i).padStart(2, '0')}`,
        title: `Test Image ${i + 1}`,
      }));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(items),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(APOD_MOCK),
      });
    }
  });

  // NEO Feed
  await page.route('**/api.nasa.gov/neo/rest/v1/feed*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(NEO_MOCK),
    }),
  );

  // ISS position
  await page.route('**/api.wheretheiss.at/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        latitude: 45.5,
        longitude: -73.5,
        altitude: 408,
        velocity: 27600,
        timestamp: Date.now(),
      }),
    }),
  );

  // People in space
  await page.route('**/corquaid.github.io/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        number: 7,
        people: [
          { name: 'Test Astronaut', spacecraft: 'ISS' },
          { name: 'Test Cosmonaut', spacecraft: 'ISS' },
          { name: 'Test Taikonaut', spacecraft: 'Tiangong' },
          { name: 'Crew Member 4', spacecraft: 'ISS' },
          { name: 'Crew Member 5', spacecraft: 'ISS' },
          { name: 'Crew Member 6', spacecraft: 'Tiangong' },
          { name: 'Crew Member 7', spacecraft: 'ISS' },
        ],
      }),
    }),
  );

  // EPIC
  await page.route('**/api.nasa.gov/EPIC/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );

  // DONKI (solar flares, CME, storms)
  await page.route('**/api.nasa.gov/DONKI/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    }),
  );

  // Mars rover photos (NASA Image Library)
  await page.route('**/images-api.nasa.gov/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collection: {
          items: [
            {
              data: [
                {
                  nasa_id: 'mars-1',
                  title: 'Mars Photo 1',
                  date_created: '2026-01-01T00:00:00Z',
                  description: 'Test Mars photo',
                  center: 'JPL',
                },
              ],
              links: [{ href: 'https://test.jpg', rel: 'preview', render: 'image' }],
              href: 'https://test-collection.json',
            },
            {
              data: [
                {
                  nasa_id: 'mars-2',
                  title: 'Mars Photo 2',
                  date_created: '2026-01-02T00:00:00Z',
                  description: 'Another test Mars photo',
                  center: 'JPL',
                },
              ],
              links: [{ href: 'https://test2.jpg', rel: 'preview', render: 'image' }],
              href: 'https://test-collection2.json',
            },
          ],
          metadata: { total_hits: 2 },
        },
      }),
    }),
  );
}
