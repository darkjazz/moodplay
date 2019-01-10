import { Injectable } from '@angular/core';
import { FeatureService as DjFeatureService, Beat, Feature } from 'auto-dj';
import { MoodplayService } from './moodplay.service';
import { Features } from '../shared/models';

const keyMap = {
  "C": 0,
  "C#": 1,
  "Db": 1,
  "D": 2,
  "D#": 3,
  "Eb": 3,
  "E": 4,
  "F": 5,
  "F#": 6,
  "Gb": 6,
  "G": 7,
  "G#": 8,
  "Ab": 8,
  "A": 9,
  "Bb": 10,
  "B": 11
}

@Injectable()
export class FeatureService implements DjFeatureService {

  private uriToFeatures = new Map<string, Features>();

  constructor(private moodplayService: MoodplayService) { }

  async getBeats(audioUri: string): Promise<Beat[]> {
    return (await this.getFeatures(audioUri)).beats
      .map(b => ({time:{value:b.start}, label:{value:b.position.toString()}}));
  }

  async getKeys(audioUri: string): Promise<Feature[]> {
    const key = (await this.getFeatures(audioUri)).key;
    const tonic = keyMap[key.split(' ')[0]];
    return [{time:{value:0}, value:tonic}];
  }

  async getLoudnesses(audioUri: string): Promise<Feature[]> {
    const loudness = (await this.getFeatures(audioUri)).loudness;
    if (loudness) {
      return loudness.map(b => ({time:{value:b.start}, value:b.value}));
    }
  }

  private async getFeatures(audioUri: string): Promise<Features> {
    if (!this.uriToFeatures.has(audioUri)) {
      this.uriToFeatures.set(audioUri, await this.moodplayService.getFeaturesFromAudio(audioUri));
    }
    return this.uriToFeatures.get(audioUri);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }

}
