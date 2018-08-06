import { Component, OnInit } from '@angular/core';
import { DeezerService } from '../services/deezer.service';
import { AutoDj } from '../mix/auto-dj';

@Component({
  selector: 'player',
  template: ``
})
export class PlayerComponent implements OnInit  {

  private dj: AutoDj;

  constructor(private deezer: DeezerService) {}

  async ngOnInit() {
    console.log(await this.deezer.get30SecClip('supersilent'));
  }

}