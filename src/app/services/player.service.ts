import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { FeatureService } from '../services/feature.service';
import { ArtistCoords, TrackCoords, Mood } from '../shared/models';
import { AutoDj, DecisionType, TransitionType } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService,
      private moodplayService: MoodplayService,
      featureService: FeatureService) {
    this.dj = new AutoDj(featureService, DecisionType.Default,
      undefined, TransitionType.Beatmatch);
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClipFromSearch(artist.name);
    console.log(clip)
    this.dj.transitionToTrack(clip);
  }

  async transitionToTrack(track: TrackCoords) {
    console.log(track.uri)
    await this.dj.isReady();
    this.dj.transitionToTrack(track.uri);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    const clip = await this.deezer.get30SecClipFromTrackId(<number>track.deezer_id);
    this.dj.transitionToTrack(clip);
  }

}
