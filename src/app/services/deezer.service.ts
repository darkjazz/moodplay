import { Injectable } from '@angular/core';
import { Jsonp } from '@angular/http';

const API_SEARCH_URL = "https://api.deezer.com/search?q=";
const PARAMS = "&index=0&limit=1";
const JSONP_OPTIONS = "&output=jsonp&callback=JSONP_CALLBACK";

interface DeezerAlbum {
  id: number,
  title: string
}

interface DeezerArtist {
  id: number,
  name: string
}

export interface DeezerItem {
  album: DeezerAlbum,
  artist: DeezerArtist,
  link: string,
  preview: string
}

@Injectable()
export class DeezerService {

  constructor(private jsonp: Jsonp) {}

  async get30SecClip(searchString: string): Promise<string> {
    const query = API_SEARCH_URL+'"'+searchString+'"'+PARAMS+JSONP_OPTIONS;
    const response = await this.jsonp.get(query).toPromise();
    const items: DeezerItem[] = (await response.json()).data;
    return items.length > 0 ? items[0].preview : undefined;
  }

}