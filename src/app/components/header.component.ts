import { Component, Input, Inject, HostBinding } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { PlayerService } from '../services/player.service';
import { Track } from '../shared/models';

@Component({
  selector: 'header',
  templateUrl: 'header.component.html',
  styleUrls: ['header.component.scss']
})
export class HeaderComponent {
  title = 'moodplay';
  playerIcon = "play_circle_outline";
  currentTrack: Track;
  previousTrack: Track;

  @Input()
  set track(track: Track) {
    this.previousTrack = this.currentTrack;
    this.currentTrack = track;
  }

  constructor(
    private playerService: PlayerService
  ) { }

  play() {
    this.playerIcon = (this.playerIcon == "play_circle_outline") ?
      this.playerIcon = "pause_circle_outline" : this.playerIcon = "play_circle_outline";
    this.playerService.togglePlay();
  }

}
