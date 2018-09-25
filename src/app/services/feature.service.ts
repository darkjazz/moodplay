import { Injectable } from '@angular/core';
import { FeatureService as DjFeatureService, Beat, Feature } from 'auto-dj';
import { MoodplayService } from './moodplay.service';

@Injectable()
export class FeatureService implements DjFeatureService {



  constructor(private moodplayService: MoodplayService) { }

  getBeats(audioUri: string): Promise<Beat[]> {
    return this.getFeatures(audioUri);
  }

  getKeys(audioUri: string): Promise<Feature[]> {
    return this.getFeatures(audioUri);
  }

  getLoudnesses(audioUri: string): Promise<Feature[]> {
    return this.getFeatures(audioUri);
  }

  private getFeatures(audioUri: string): Promise<any> {
    return this.moodplayService.getFeaturesFromAudio(audioUri);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

}
