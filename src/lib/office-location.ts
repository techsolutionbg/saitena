/** Public office address supplied by the owner; coordinates match this address. */
export const officeLocation = {
  address: "гр. Дупница, ул. „Благодарност“ 9а",
  latitude: 42.2679971,
  longitude: 23.122418,
};

export function officeDirectionsUrl(): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set(
    "destination",
    `${officeLocation.latitude},${officeLocation.longitude}`,
  );
  // Omit origin so Maps can use the visitor's current location when available.
  url.searchParams.set("dir_action", "navigate");
  return url.href;
}
