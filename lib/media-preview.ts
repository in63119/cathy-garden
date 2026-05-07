export function isImageContentType(contentType: string) {
  return contentType.startsWith("image/");
}

export function isVideoContentType(contentType: string) {
  return contentType.startsWith("video/");
}

export function getMediaKindLabel(contentType: string) {
  if (isImageContentType(contentType)) {
    return "image";
  }

  if (isVideoContentType(contentType)) {
    return "video";
  }

  return "file";
}
