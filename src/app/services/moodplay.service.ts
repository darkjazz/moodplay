import { Injectable } from '@angular/core';
import { Headers, Http, Response, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';
import { Observer } from 'rxjs/Observer';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

import { Artist, Coords, Track, TrackCoords, ArtistCoords,
  Limits, Mood, User, Party, UserCoords, Features } from '../shared/models';
import { generateName, getUserGuid } from '../shared/util';
import { Config } from '../shared/config';

import * as socketIo from 'socket.io-client';

@Injectable()
export class MoodplayService {
  private socket;

  constructor(private http: Http) { }

  public initSocket(): void {
    this.socket = socketIo(Config.server + '/global');
  }

  public sendUserCoordinates(userID: string, valence: number, arousal: number, partyID?: string): void {
    var partyID = partyID ? partyID : Config.globalPartyID;
    this.socket.emit('user_coordinates', {
      id: userID, valence: valence, arousal: arousal, partyID: partyID
    });
  }

  public onPartyMessage(): Observable<Party> {
    return new Observable<Party>(observer => {
        this.socket.on('party_message', (data: Party) => observer.next(data));
    });
  }

  public onAverageCoordinates(): Observable<TrackCoords> {
    return new Observable<TrackCoords>(observer => {
        this.socket.on('average_coordinates', (data: TrackCoords) => observer.next(data));
    });
  }

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

  public addUser(partyID?: string, name?: string): Promise<User> {
    var uaid = getUserGuid();
    partyID = partyID ? partyID : Config.globalPartyID;
    name = name ? name : generateName();
    console.log(name);
    var params = `/${ partyID }/${ uaid }/${ name }`;
    return this.http.get(Config.server + Config.user + '/add_user' + params)
      .toPromise()
      .then((res:Response) => {
        return res.json() as User;
      })
      .catch(this.handleError)
  }

  public addUserCoordinates(userID: string, valence: number, arousal: number, partyID?: string): Promise<Party>{
    var partyID = partyID ? partyID : Config.globalPartyID;
    var params = `/${ partyID }/${ userID }/${ valence }/${ arousal }`;
    console.log(Config.server + Config.user + '/add_user_coordinates' + params);
    return this.http.get(Config.server + Config.user + '/add_user_coordinates' + params)
      .toPromise()
      .then((res:Response) => {
        return res.json() as Party;
      })
      .catch(this.handleError)
  }

  public getFeaturesFromAudio(audioUri: string): Promise<Features> {
    var param = `/${ btoa(audioUri) }`;
    return this.http.get(Config.server + Config.moodplay + '/get_track_features_by_uri' + param)
      .toPromise()
      .then((res:Response) => {
        return res.json();
      })
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
