import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

import { Coords, Track, TrackCoords, ArtistCoords,
  Mood, User, Party, Features, PartyMessage } from '../shared/models';
import { generateName, getUserGuid } from '../shared/util';
import { Config } from '../shared/config';

import * as socketIo from 'socket.io-client';

@Injectable()
export class MoodplayService {
  private socket;
  private user: User;
  private party: Party;

  constructor(private http: Http) { }

  public initSocket(): void {
    if (this.party && this.party.id != Config.globalPartyID)
      this.socket = socketIo(Config.server + '/' + this.party.id);
    else
      this.socket = socketIo(Config.server + '/global');
  }

  public sendUserCoordinates(userID: string, valence: number, arousal: number): void {
    var partyID = this.party.id == Config.globalPartyID ? Config.globalPartyID : this.party.id;
    this.socket.emit('user_coordinates', {
      id: userID, valence: valence, arousal: arousal, partyID: partyID
    });
  }

  public onPartyMessage(): Observable<PartyMessage> {
    return new Observable<PartyMessage>(observer => {
        this.socket.on('party_message', (data: PartyMessage) => observer.next(data));
    });
  }

  // public onTrackCoordinates(): Observable<TrackCoords> {
  //   return new Observable<TrackCoords>(observer => {
  //       this.socket.on('track_coordinates', (data: TrackCoords) => observer.next(data));
  //   });
  // }
  //
  public onCursorMessage(): Observable<Coords> {
    return new Observable<Coords>(observer => {
      this.socket.on('cursor_coordinates', (data: Coords) => observer.next(data));
    })
  }

  public getNearestTrack(valence: Number, arousal: Number): Promise<TrackCoords> {
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
        this.user = res.json() as User;
        return this.user;
      })
      .catch(this.handleError)
  }

  public changeUserName(name: string, partyID?: string): Promise<User> {
    this.user.name = name;
    partyID = partyID ? partyID : Config.globalPartyID;
    var params = `/${ partyID }/${ this.user.id }/${ name }`;
    return this.http.get(Config.server + Config.user + '/change_name' + params)
      .toPromise()
      .then((res:Response) => {
        this.user = res.json() as User;
        return this.user;
      })
      .catch(this.handleError)

  }

  public getUser(): User { return this.user; }

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

  public createUserParty(user:User): Promise<Party> {
    var param = `/${ user.id }`;
    return this.http.get(Config.server + Config.user + '/create_new_party' + param)
      .toPromise()
      .then((res:Response) => {
        this.party = res.json() as Party;
        this.socket = socketIo(Config.server + '/' + this.party.id);
        return this.party;
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
