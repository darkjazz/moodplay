import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { FeatureService } from '../services/feature.service';
import { ArtistCoords, Mood, TrackCoords } from '../shared/models';
import { AutoDj, DecisionType, TransitionType } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;
  private isPlaying = false;
  private lastAudioUri: string;

  constructor(private deezer: DeezerService,
    private moodplayService: MoodplayService,
    private featureService: FeatureService) {}
  
  togglePlay() {
    if (!this.isPlaying) {
      this.init();
      if (this.lastAudioUri) {
        this.transition(this.lastAudioUri);
      }
    } else {
      //this.dj.stop(); //IN NEW VERSION!
    }
    this.isPlaying = !this.isPlaying;
  }
  
  async transitionToTrack(track: TrackCoords) {
    this.transition(track.uri);
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClipFromSearch(artist.name);
    this.transition(clip);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    this.transition(track.uri);
  }
  
  private init() {
    if (!this.dj) {
      this.dj = new AutoDj(this.featureService, DecisionType.Default,
        undefined, TransitionType.Beatmatch);
    }
  }
  
  private transition(audioUri: string) {
    console.log(audioUri)
    this.lastAudioUri = audioUri;
    if (this.dj) {
      this.dj.transitionToTrack(audioUri);
    }
  }

}
