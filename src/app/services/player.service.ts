import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { ArtistCoords, TrackCoords, Mood } from '../shared/models';
import { AutoDj, DecisionType, TransitionType, FeatureService } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService,
      private moodplayService: MoodplayService,
      featureService: FeatureService) {
    this.dj = new AutoDj({
      featureService: featureService,
      decisionType: DecisionType.Default,
      defaultTransition: TransitionType.Beatmatch
    });
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
