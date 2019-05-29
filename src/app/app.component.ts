import { Component } from '@angular/core';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { MenuOverlayRef }   from './shared/overlayref';
import { ComponentPortal }  from '@angular/cdk/portal';
import { EntryComponent }    from './components/entry.component';
import { User, PartyMessage, Party, TrackCoords, Coords } from './shared/models';
import { PlayerService } from './services/player.service';
import { MoodplayService } from './services/moodplay.service';

interface MenuOverlayConfig {
    panelClass?: string;
    hasBackdrop?: boolean;
    backdropClass?: string;
}

const DEFAULT_CONFIG: MenuOverlayConfig = {
  hasBackdrop: true,
  backdropClass: 'dark-backdrop',
  panelClass: 'overlay-panel'
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  selectionVariable = 'play';
  user: User;
  party: Party;
  track: TrackCoords;
  coords: Coords;

  ioPartyMessage;

  constructor(
    private overlay: Overlay,
    private playerService: PlayerService,
    private moodplayService: MoodplayService
  ) { }

  ngOnInit(): void {
    this.initIoConnection();
    this.moodplayService.addUser()
      .then(user => {
        this.user = user;
      })
  }

  initIoConnection() {
    this.moodplayService.initSocket();

    this.ioPartyMessage = this.moodplayService.onPartyMessage()
      .subscribe(async (msg: PartyMessage) => {
        this.party = msg.party;
        this.coords = msg.coords;
        if (msg.track) {
          await this.playerService.transitionToTrack(msg.track);
          this.track = msg.track;
        }
      });
  }

  onSelected(text: string) {
    this.selectionVariable = text;
  }

  showOverlay() {
    var viewPortal = new ComponentPortal(EntryComponent);
    const overlayRef = this.createOverlay();
    const dialogRef = new MenuOverlayRef(overlayRef);
    overlayRef.attach(viewPortal);
    overlayRef.backdropClick().subscribe(_ => dialogRef.close());
    return dialogRef;
  }

  play() {
    this.playerService.togglePlay();
  }

  private createOverlay() {
    const overlayConfig = this.getOverlayConfig(DEFAULT_CONFIG);
    return this.overlay.create(overlayConfig);
  }

  private getOverlayConfig(config: MenuOverlayConfig): OverlayConfig {
    const positionStrategy = this.overlay.position()
      .global()
      .centerHorizontally()
      .centerVertically();

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      backdropClass: config.backdropClass,
      panelClass: config.panelClass,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy
    });

    return overlayConfig;
  }
}
