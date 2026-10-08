export function googleMapsWalkingDirectionsUrl(destination, origin) {
  const normalizedDestination = destination.trim();
  if (!normalizedDestination) return '';

  const params = new URLSearchParams({
    api: '1',
    destination: normalizedDestination,
    travelmode: 'walking',
  });
  if (origin) params.set('origin', `${origin.latitude},${origin.longitude}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
