const OLA_API_KEY = import.meta.env.VITE_OLA_MAPS_KEY || '';

export interface AutocompleteSuggestion {
  description: string;
  place_id: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export async function fetchAutocomplete(input: string): Promise<AutocompleteSuggestion[]> {
  if (!input || !OLA_API_KEY) return [];
  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/autocomplete?input=${encodeURIComponent(
        input
      )}&api_key=${OLA_API_KEY}`
    );
    if (!response.ok) throw new Error('Autocomplete failed');
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error('Ola Maps Autocomplete Error:', error);
    return [];
  }
}

export async function fetchPlaceDetails(placeId: string): Promise<LocationCoordinates | null> {
  if (!placeId || !OLA_API_KEY) return null;
  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/details?place_id=${encodeURIComponent(
        placeId
      )}&api_key=${OLA_API_KEY}`
    );
    if (!response.ok) throw new Error('Details failed');
    const data = await response.json();
    const result = data.result;
    if (result && result.geometry && result.geometry.location) {
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        address: result.formatted_address || result.name || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Ola Maps Details Error:', error);
    return null;
  }
}

export async function fetchReverseGeocode(lat: number, lng: number): Promise<string> {
  if (!OLA_API_KEY) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  try {
    const response = await fetch(
      `https://api.olamaps.io/places/v1/reverse-geocode?latlng=${lat},${lng}&api_key=${OLA_API_KEY}`
    );
    if (!response.ok) throw new Error('Reverse geocode failed');
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Ola Maps Reverse Geocode Error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
