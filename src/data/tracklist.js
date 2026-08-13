// Real tracklist for Ayra Starr's new album. Album artwork isn't provided
// yet — every track shares one placeholder square until real art arrives.
// Keep the shape stable: { id, number, title, artist, artUrl }.

const PLACEHOLDER_ART = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%232A1147'/%3E%3Cpath d='M50 20 L58 42 L82 42 L62 56 L70 80 L50 65 L30 80 L38 56 L18 42 L42 42 Z' fill='%239B4DFF'/%3E%3C/svg%3E";

export const ARTIST_NAME = "Ayra Starr";

// Spotify-style credit line: the album artist, plus any featured artist.
function credit(feat) {
  return feat ? `${ARTIST_NAME}, ${feat}` : ARTIST_NAME;
}

const RAW_TRACKS = [
  { title: "Dangerous" },
  { title: "Amazing", feat: "kwn" },
  { title: "Gimme Dat", feat: "Wizkid" },
  { title: "Pressure", feat: "Leon Thomas" },
  { title: "Tornado" },
  { title: "Midnight in New York" },
  { title: "Hot Body" },
  { title: "Ms. Paper", feat: "Theodora" },
  { title: "Dance" },
  { title: "Where Do We Go" },
  { title: "Who's Dat Girl", feat: "Rema" },
  { title: "Misunderstood" },
  { title: "Letter To God" },
  { title: "Heaven Baby", feat: "ZAYN" },
  { title: "Treasure" },
  { title: "Hot Body Remix", feat: "Danny Ocean" },
];

export const tracklist = RAW_TRACKS.map((track, i) => ({
  id: `t${i + 1}`,
  number: i + 1,
  title: track.title,
  artist: credit(track.feat),
  artUrl: PLACEHOLDER_ART,
}));

export const REQUIRED_TOP_FIVE = 5;
