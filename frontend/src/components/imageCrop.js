// Pure crop math for the Sell photo adjuster. No DOM here, so vitest covers it.
//
// Model: the crop frame has a fixed aspect ratio. At zoom 1 it shows the
// largest rect of that ratio fitting inside the photo. Zooming in shrinks
// the shown region around its centre; dragging moves the centre. The region
// is always clamped inside the photo, so the frame never shows empty space.

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;
export const MAX_OUTPUT_EDGE = 1200;

export const CROP_RATIOS = [
  { id: 'card', label: 'Card (16:9)', value: 16 / 9 },
  { id: '4:3', label: '4:3', value: 4 / 3 },
  { id: '1:1', label: 'Square (1:1)', value: 1 },
  { id: 'original', label: 'Original', value: null },
];

// Largest rect of the given aspect that fits inside the image, centred.
// A null ratio means the photo's own aspect (the whole photo).
export function fitRect(imageWidth, imageHeight, ratio) {
  const r = ratio || imageWidth / imageHeight;
  let w = imageWidth;
  let h = w / r;
  if (h > imageHeight) {
    h = imageHeight;
    w = h * r;
  }
  return { x: (imageWidth - w) / 2, y: (imageHeight - h) / 2, width: w, height: h };
}

// Photo region (in original-image pixels) shown inside the crop frame.
export function cropRect(imageWidth, imageHeight, ratio, zoom, offsetX, offsetY) {
  const fit = fitRect(imageWidth, imageHeight, ratio);
  const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom || MIN_ZOOM));
  const width = fit.width / z;
  const height = fit.height / z;
  const centreX = fit.x + fit.width / 2 + (offsetX || 0);
  const centreY = fit.y + fit.height / 2 + (offsetY || 0);
  const clampedX = Math.min(imageWidth - width / 2, Math.max(width / 2, centreX));
  const clampedY = Math.min(imageHeight - height / 2, Math.max(height / 2, centreY));
  return { x: clampedX - width / 2, y: clampedY - height / 2, width, height };
}

// Output size for the cropped file: never upscale, cap the long edge.
export function outputSize(cropWidth, cropHeight, maxEdge = MAX_OUTPUT_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(cropWidth, cropHeight));
  return {
    width: Math.max(1, Math.round(cropWidth * scale)),
    height: Math.max(1, Math.round(cropHeight * scale)),
  };
}
