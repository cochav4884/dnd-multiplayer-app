// src/utils/importAllImages.js
export function importAllImages(r) {
  if (!r) return {};
  let images = {};
  r.keys().forEach((item) => {
    images[item.replace('./', '')] = r(item);
  });
  return images;
}
