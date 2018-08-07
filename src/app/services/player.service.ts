import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { MoodplayService } from '../services/moodplay.service';
import { FeatureExtractionService } from '../services/feature-extraction.service';
import { ArtistCoords, TrackCoords, Mood } from '../shared/models';
import { AutoDj } from '../mix/auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService, features: FeatureExtractionService,
    private moodplayService: MoodplayService) {
    this.dj = new AutoDj(null, features);
    this.dj.init();
  }

  async transitionToArtist(artist: ArtistCoords) {
    const clip = await this.deezer.get30SecClip(artist.name);
    this.dj.transitionToSong(clip);
  }

  async transitionToTrack(track: TrackCoords) {
    const clip = await this.deezer.get30SecClip(track.filename);
    this.dj.transitionToSong(clip);
  }

  async transitionToMood(mood: Mood) {
    const track = await this.moodplayService.getNearestTrack(mood.valence, mood.arousal);
    this.dj.transitionToSong(track.filename);
  }

}