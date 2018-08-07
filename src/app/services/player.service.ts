import { Injectable } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { FeatureExtractionService } from '../services/feature-extraction.service';
import { ArtistCoords } from '../shared/models';
import { AutoDj } from '../mix/auto-dj';

@Injectable()
export class PlayerService  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService, features: FeatureExtractionService) {
    this.dj = new AutoDj(null, features);
    this.dj.init();
  }

  async transitionToArtist(artist: ArtistCoords) {
    const songClip = await this.deezer.get30SecClip(artist.name);
    console.log(songClip);
    this.dj.transitionToSong(songClip);
  }

}