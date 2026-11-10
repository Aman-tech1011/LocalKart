import { describe, expect, it } from 'vitest';
import { cropRect, fitRect, outputSize } from './imageCrop';

describe('fitRect', () => {
  it('fits a 16:9 frame inside a landscape photo, centred', () => {
    const rect = fitRect(1600, 900, 16 / 9);
    expect(rect).toEqual({ x: 0, y: 0, width: 1600, height: 900 });
  });

  it('fits a 16:9 frame inside a portrait photo, cropping top and bottom', () => {
    const rect = fitRect(900, 1600, 16 / 9);
    expect(rect.width).toBe(900);
    expect(rect.height).toBeCloseTo(506.25);
    expect(rect.x).toBe(0);
    expect(rect.y).toBeCloseTo((1600 - 506.25) / 2);
  });

  it('uses the whole photo for the original ratio', () => {
    expect(fitRect(800, 600, null)).toEqual({ x: 0, y: 0, width: 800, height: 600 });
  });
});

describe('cropRect', () => {
  it('at zoom 1 shows the fitted rect', () => {
    expect(cropRect(900, 1600, 16 / 9, 1, 0, 0)).toEqual(fitRect(900, 1600, 16 / 9));
  });

  it('zoom 2 halves the shown region around the centre', () => {
    const rect = cropRect(1600, 900, 16 / 9, 2, 0, 0);
    expect(rect.width).toBe(800);
    expect(rect.height).toBe(450);
    expect(rect.x).toBe(400);
    expect(rect.y).toBe(225);
  });

  it('clamps the region inside the photo when dragged past the edge', () => {
    const rect = cropRect(1600, 900, 16 / 9, 2, 10000, 0);
    expect(rect.x + rect.width).toBeLessThanOrEqual(1600);
    expect(rect.x).toBe(800);
  });
});

describe('outputSize', () => {
  it('never upscales a small crop', () => {
    expect(outputSize(400, 300)).toEqual({ width: 400, height: 300 });
  });

  it('caps the long edge at 1200', () => {
    expect(outputSize(2400, 1350)).toEqual({ width: 1200, height: 675 });
  });
});
