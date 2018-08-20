export class Artist{
  name: string;
  mbid: string;
  deezer_id: Number;
}

export class Coords{
  valence: Number;
  arousal: Number;
  dominance: Number;
}

export class Track {
  id: Number;
  ilm_id: string;
  mbid: string;
  deezer_id: Number;
  filename: string;
  song_title: string;
  track_duration: string;
  album_title: string;
  release_year: string;
  preview: string;
  artist: Artist;
  coords: Coords;
}

export class TrackCoords{
  valence: Number;
  arousal: Number;
  deezer_id: number;
  filename: string;
  artist: string;
  title: string;
}

export class ArtistCoords{
  name: string;
  valence: Number;
  arousal: Number;
  track_count: Number;
}

export class Limits{
  max_valence: Number;
  min_valence: Number;
  max_arousal: Number;
  min_arousal: Number;
}

export class Mood{
  label: string;
  valence: Number;
  arousal: Number;
}
