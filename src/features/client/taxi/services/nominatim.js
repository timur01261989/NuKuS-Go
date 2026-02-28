// src/features/client/taxi/services/nominatim.js
/**
 * Nominatim API search wrapper for address/place search
 */

export async function nominatimSearch(query, signal = null) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '10');
    url.searchParams.set('addressdetails', '1');

    const options = {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TaxiClient/1.0'
      }
    };

    if (signal) {
      options.signal = signal;
    }

    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
      console.warn(`Nominatim search failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }

    // Transform Nominatim results to a common format
    return data.map(item => ({
      id: item.osm_id,
      address: item.display_name || '',
      name: item.name || '',
      latitude: parseFloat(item.lat) || null,
      longitude: parseFloat(item.lon) || null,
      lat: parseFloat(item.lat) || null,
      lng: parseFloat(item.lon) || null,
      type: item.type || 'place',
      osm_type: item.osm_type,
      osm_id: item.osm_id,
      address_type: item.address_type || ''
    }));
  } catch (error) {
    if (error.name === 'AbortError') {
      // Request was cancelled
      return [];
    }
    console.error('Nominatim search error:', error);
    return [];
  }
}
