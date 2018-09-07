import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { ArtistCoords, TrackCoords, Mood } from '../shared/models';
import { AutoDj } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService,
      private moodplayService: MoodplayService) {
    this.dj = new AutoDj();
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClipFromSearch(artist.name);
    console.log(clip)
    this.dj.transitionToTrack(clip);
  }

  async transitionToTrack(track: TrackCoords) {
    this.dj.transitionToTrack(track.uri);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    const clip = await this.deezer.get30SecClipFromTrackId(<number>track.deezer_id);
    this.dj.transitionToTrack(clip);
  }

}
