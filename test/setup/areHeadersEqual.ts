import { Headers, HeadersInit } from 'miniflare';
import { expect } from 'vitest';
import { decodeAttributes } from '../../src/lib/parts';

function areHeadersEqual(headerOrInitA: Headers | HeadersInit, headerOrInitB: Headers | HeadersInit): boolean | undefined {
  try {
    // eslint-disable-next-line no-nested-ternary
    const headerA = headerOrInitA instanceof Headers
      ? headerOrInitA
      : typeof headerOrInitA === 'object'
        ? new Headers(headerOrInitA)
        : undefined;
    // eslint-disable-next-line no-nested-ternary
    const headerB = headerOrInitB instanceof Headers
      ? headerOrInitB
      : typeof headerOrInitB === 'object'
        ? new Headers(headerOrInitB)
        : undefined;
    if (!headerA || !headerB) {
      return undefined;
    }
    const keysA = [...headerA.keys()].sort();
    const keysB = [...headerB.keys()].sort();
    if (keysA.length !== keysB.length) {
      return false;
    }
    for (let x = 0; x < keysA.length; x++) {
      if (keysA[x] !== keysB[x]) {
        return false;
      }
      const key = keysA[x];
      const valueA = decodeAttributes(headerA.get(key) || '');
      const valueB = decodeAttributes(headerB.get(key) || '');
      const valueAKeys = Object.keys(valueA).sort();
      const valueBKeys = Object.keys(valueB).sort();
      if (valueAKeys.length !== valueBKeys.length) {
        return false;
      }
      for (let y = 0; y < valueAKeys.length; y++) {
        if (valueAKeys[y] !== valueBKeys[y]) {
          return false;
        }
        const valueKey = valueAKeys[y];
        if (valueA[valueKey] !== valueB[valueKey]) {
          return false;
        }
      }
    }
    return true;
  } catch (e) {
    return undefined;
  }
}

expect.addEqualityTesters([areHeadersEqual]);
