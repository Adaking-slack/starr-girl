// Placeholder tracklist — swap with real album data (title, artist, artUrl) when provided.
// Keep the shape stable: { id, number, title, artist, artUrl } so the UI never needs to change.

const PLACEHOLDER_ART = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%232A1147'/%3E%3Cpath d='M50 20 L58 42 L82 42 L62 56 L70 80 L50 65 L30 80 L38 56 L18 42 L42 42 Z' fill='%239B4DFF'/%3E%3C/svg%3E";

export const ARTIST_NAME = "Ayra Starr";

export const tracklist = [
  { id: "t1", number: 1, title: "Track One", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t2", number: 2, title: "Track Two", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t3", number: 3, title: "Track Three", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t4", number: 4, title: "Track Four", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t5", number: 5, title: "Track Five", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t6", number: 6, title: "Track Six", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t7", number: 7, title: "Track Seven", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t8", number: 8, title: "Track Eight", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t9", number: 9, title: "Track Nine", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t10", number: 10, title: "Track Ten", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t11", number: 11, title: "Track Eleven", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
  { id: "t12", number: 12, title: "Track Twelve", artist: ARTIST_NAME, artUrl: PLACEHOLDER_ART },
];

export const REQUIRED_TOP_FIVE = 5;
