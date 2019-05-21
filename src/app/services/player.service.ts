import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { FeatureService } from '../services/feature.service';
import { ArtistCoords, TrackCoords, Mood, Coords, Track } from '../shared/models';
import { AutoDj, DecisionType, TransitionType } from 'auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;
  private isPlaying = false;

  constructor(private deezer: DeezerService,
    private moodplayService: MoodplayService,
    private featureService: FeatureService) {}
  
  togglePlay() {
    if (!this.isPlaying) {
      this.init();
    } else {
      //this.dj.stop(); //IN NEW VERSION!
    }
    this.isPlaying = !this.isPlaying;
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClipFromSearch(artist.name);
    this.transition(clip);
  }

  async transitionToTrack(track: TrackCoords) {
    this.transition(track.uri);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    this.transitionToTrack2(track);
  }
  
  private init() {
    if (!this.dj) {
      this.dj = new AutoDj(this.featureService, DecisionType.Default,
        undefined, TransitionType.Beatmatch);
    }
    this.moodplayService.onCursorMessage().subscribe(async (coords: Coords) => {
      const track = await this.moodplayService.getNearestTrack(coords.valence, coords.arousal);
      this.transitionToTrack2(track);
    })
  }
  
  private async transitionToTrack2(track: Track) {
    this.transition(await this.deezer.get30SecClipFromTrackId(<number>track.deezer_id));
  }
  
  private transition(audioUri: string) {
    console.log(audioUri)
    if (this.dj) {
      this.dj.transitionToTrack(audioUri);
    }
  }

}
