import { Injectable } from '@angular/core';
import { take } from 'rxjs/operators';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { FeatureService } from '../services/feature.service';
import { ArtistCoords, Mood, TrackCoords } from '../shared/models';
import { AutoDj, DecisionType } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;
  private isPlaying = false;
  private lastAudioUri: string;

  constructor(private deezer: DeezerService,
    private moodplayService: MoodplayService,
    private featureService: FeatureService) {}

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.init();
      if (this.lastAudioUri) {
        this.transition(this.lastAudioUri);
      }
    } else {
      this.dj.stop();
    }
  }

  transitionToTrack(track: TrackCoords) {
    return this.transition(track.uri);
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClipFromSearch(artist.name);
    return this.transition(clip);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    return this.transition(track.uri);
  }

  private init() {
    if (!this.dj) {
      this.dj = new AutoDj(this.featureService, DecisionType.DecisionTree);
    }
  }

  private async transition(audioUri: string) {
    console.log(audioUri)
    this.lastAudioUri = audioUri;
    if (this.dj && this.isPlaying) {
      await this.dj.transitionToTrack(audioUri);
      //gets sent as soon as the dj starts transitioning
      return this.dj.getTransitionObservable().pipe(take(1)).toPromise();
    }
  }

}
