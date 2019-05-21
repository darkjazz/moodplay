import { Component } from '@angular/core';
import { PlayerService } from '../services/player.service';

@Component({
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent {
  title = 'moodplay';
  playerIcon = "play_circle_outline";
  currentlyPlaying = "roots manuva: evil rabbit";

  constructor(
    private playerService: PlayerService
  ) { }

  play() {
    this.playerIcon = (this.playerIcon == "play_circle_outline") ?
      this.playerIcon = "pause_circle_outline" : this.playerIcon = "play_circle_outline";
    this.playerService.togglePlay();
  }

}
