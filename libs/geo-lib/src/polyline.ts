/**
 * Google Polyline encoding/decoding
 * Used for route display on maps
 */

export function encodePolyline(coords: [number, number][]): string {
  let output = "";
  let prevLat = 0, prevLng = 0;

  for (const [lat, lng] of coords) {
    const dLat = Math.round((lat - prevLat) * 1e5);
    const dLng = Math.round((lng - prevLng) * 1e5);
    output += encodeChunk(dLat) + encodeChunk(dLng);
    prevLat = lat;
    prevLng = lng;
  }
  return output;
}

function encodeChunk(value: number): string {
  let encoded = "";
  let v = value < 0 ? ~(value << 1) : value << 1;
  while (v >= 0x20) {
    encoded += String.fromCharCode(((v & 0x1f) | 0x20) + 63);
    v >>= 5;
  }
  encoded += String.fromCharCode(v + 63);
  return encoded;
}

export function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let idx = 0, lat = 0, lng = 0;

  while (idx < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0; result = 0;
    do { b = encoded.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}
