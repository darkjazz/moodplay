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
  uri: string;
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
  valence: number;
  arousal: number;
}

export class UserCoords{
  valence: number;
  arousal: number;
  date: string;
}

export class User{
  id: string;
  uaid: string;
  uri: string;
  name: string;
  updated: string;
  current_coords: UserCoords;
  history: UserCoords[];
}

export class Party{
  id: string;
  uri: string;
  updated: string;
  owner_id: string;
  users: User[];
}

export interface Features {
  beats: Beat[],
  key: string,
  loudness: Feature[]
}

export interface Beat {
  start: number,
  position: number
}

export interface Feature {
  start: number,
  value: number
}
