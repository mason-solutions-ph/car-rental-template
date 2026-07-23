export const CAR_IMAGE_BUCKET = "car-images";
export const MAX_CAR_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_CAR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedCarImageType = (typeof ALLOWED_CAR_IMAGE_TYPES)[number];

export type ImageFileValidation =
  | { ok: true; ext: string; contentType: AllowedCarImageType }
  | { ok: false; error: string };

const EXT_BY_TYPE: Record<AllowedCarImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateCarImageFile(file: {
  type: string;
  size: number;
  name?: string;
}): ImageFileValidation {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (file.size > MAX_CAR_IMAGE_BYTES) {
    return { ok: false, error: "Image must be 5MB or smaller." };
  }
  const type = file.type as AllowedCarImageType;
  if (!ALLOWED_CAR_IMAGE_TYPES.includes(type)) {
    return { ok: false, error: "Use a JPG, PNG, or WebP image." };
  }
  return { ok: true, ext: EXT_BY_TYPE[type], contentType: type };
}

export function carImageObjectPath(ext: string, id = crypto.randomUUID()): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  return `heroes/${id}.${safeExt}`;
}
