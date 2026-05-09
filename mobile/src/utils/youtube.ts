/** Same as frontend/src/utils/youtube.ts — thumbnail for lesson cards */
export function getYouTubeThumbnail(videoUrl: string): string {
  const videoId =
    videoUrl.split('v=')[1]?.split('&')[0] || videoUrl.split('youtu.be/')[1];
  if (!videoId) {
    return '';
  }
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
