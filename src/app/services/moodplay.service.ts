import { Injectable } from '@angular/core';
import { Headers, Http, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

import { Artist, Coords, Track, TrackCoords, ArtistCoords, Limits, Mood } from '../shared/models';
import { Config } from '../shared/config';

@Injectable()
export class MoodplayService {
  constructor(private http: Http) { }

  public getNearestTrack(valence: Number, arousal: Number): Promise<Track> {
    var params = `/${ valence }/${ arousal }`;
    return this.http.get(Config.server + Config.moodplay + '/get_nearest_track' + params)
      .toPromise()
      .then((res:Response) => {
        return res.json() as Track;
      })
      .catch(this.handleError);
  }

  public getTrack(filename: string): Promise<Track> {
    var param = `/${ filename }`;
    return this.http.get(Config.server + Config.moodplay + '/get_track_metadata' + param)
      .toPromise()
      .then((res:Response) => {
        return res.json() as Track;
      })
      .catch(this.handleError);
  }

  public getTrackCoordinates(): Promise<TrackCoords[]> {
    return this.http.get(Config.server + Config.moodplay + '/get_all_coordinates/')
      .toPromise()
      .then((res:Response) => {
        return res.json() as TrackCoords[];
      })
      .catch(this.handleError);
  }

  public getArtistCoordinates(): Promise<ArtistCoords[]> {
    return this.http.get(Config.server + Config.moodplay + '/get_artist_coordinates/')
      .toPromise()
      .then((res:Response) => {
        return res.json() as ArtistCoords[];
      })
      .catch(this.handleError);
  }

  public getMoods(): Promise<Mood[]> {
    return this.http.get(Config.server + Config.moodplay + '/get_moods/')
      .toPromise()
      .then((res:Response) => {
        return res.json() as Mood[];
      })
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
