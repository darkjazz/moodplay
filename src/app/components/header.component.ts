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

  constructor(
    private playerService: PlayerService
  ) { }

  play() {
    if (this.playerIcon == "play_circle_outline")
      this.playerIcon = "pause_circle_outline";
    else
      this.playerIcon = "play_circle_outline";
    this.playerService.togglePlay();
  }

}
