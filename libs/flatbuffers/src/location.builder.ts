/**
 * FlatBuffers Location Encoder/Decoder
 * For use in WebSocket real-time location streaming
 * In production: generate from .fbs using `flatc --ts schema/location.fbs`
 */

// ── Simple binary encoder (manual FlatBuffers-compatible format) ──────────────
export class LocationBinaryEncoder {
  /** Encode driver location as compact binary buffer (36 bytes per point) */
  static encodePoint(
    driverId: string, lat: number, lng: number,
    bearing:  number, speed: number, timestamp: number
  ): Uint8Array {
    const buf   = new ArrayBuffer(48);
    const view  = new DataView(buf);
    const enc   = new TextEncoder();
    const idBytes = enc.encode(driverId.slice(0, 16).padEnd(16, "\0"));

    // Write bytes
    new Uint8Array(buf, 0, 16).set(idBytes);
    view.setFloat64(16, lat,     true);  // 8 bytes
    view.setFloat64(24, lng,     true);  // 8 bytes
    view.setFloat32(32, bearing, true);  // 4 bytes
    view.setFloat32(36, speed,   true);  // 4 bytes
    view.setFloat64(40, timestamp,true); // 8 bytes = total 48 bytes

    return new Uint8Array(buf);
  }

  /** Decode binary location update (zero-copy read) */
  static decodePoint(buf: ArrayBuffer | Uint8Array): {
    driver_id: string; lat: number; lng: number;
    bearing: number; speed: number; timestamp: number;
  } {
    const bytes = buf instanceof Uint8Array ? buf.buffer : buf;
    const view  = new DataView(bytes);
    const dec   = new TextDecoder();

    return {
      driver_id: dec.decode(new Uint8Array(bytes, 0, 16)).replace(/\0/g, ""),
      lat:       view.getFloat64(16, true),
      lng:       view.getFloat64(24, true),
      bearing:   view.getFloat32(32, true),
      speed:     view.getFloat32(36, true),
      timestamp: view.getFloat64(40, true),
    };
  }

  /** Encode batch of points (for WebSocket bulk send) */
  static encodeBatch(
    driverId: string,
    points:   Array<{ lat: number; lng: number; bearing: number; speed: number; timestamp: number }>
  ): Uint8Array {
    const HEADER_SIZE = 20;  // driver_id(16) + count(4)
    const POINT_SIZE  = 32;  // lat(8)+lng(8)+bearing(4)+speed(4)+ts(8)
    const buf         = new ArrayBuffer(HEADER_SIZE + points.length * POINT_SIZE);
    const view        = new DataView(buf);
    const enc         = new TextEncoder();
    const idBytes     = enc.encode(driverId.slice(0, 16).padEnd(16, "\0"));

    new Uint8Array(buf, 0, 16).set(idBytes);
    view.setUint32(16, points.length, true);

    for (let i = 0; i < points.length; i++) {
      const offset = HEADER_SIZE + i * POINT_SIZE;
      view.setFloat64(offset,      points[i].lat,       true);
      view.setFloat64(offset + 8,  points[i].lng,       true);
      view.setFloat32(offset + 16, points[i].bearing,   true);
      view.setFloat32(offset + 20, points[i].speed,     true);
      view.setFloat64(offset + 24, points[i].timestamp, true);
    }
    return new Uint8Array(buf);
  }
}
