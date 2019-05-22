import { Component, ViewChild, Injectable, Inject, Output, EventEmitter } from '@angular/core';
import { MatMenu }       from '@angular/material/menu';
import { MatButton }        from '@angular/material/button';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal }  from '@angular/cdk/portal';
import { MenuItem }         from '../shared/menuitem';
import { MenuOverlayRef }   from '../shared/overlayref';
import { EntryComponent }    from '../components/entry.component';

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

const ITEMS = [
  { "text": "play", "icon": "touch_app" },
  { "text": "artists", "icon": "record_voice_over" },
  { "text": "tracks", "icon": "music_video" },
  { "text": "moods", "icon": "mood" },
  { "text": "github", "icon": "cloud_download" }
];

@Component({
  selector: 'ml-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
})
@Injectable()
export class Menu {
  @ViewChild('matMenu') menu: MatMenu;
  // @ViewChild('navbtn') navbtn: MatButton;
  @Output() selectionEvent = new EventEmitter<string>();
  items: MenuItem[];
  constructor(private overlay: Overlay) {
    this.items = new Array<MenuItem>();
    ITEMS.forEach(item => {
      this.items.push(item as MenuItem)
    })
  }

  showOverlay() {
    var viewPortal = new ComponentPortal(EntryComponent);
    const overlayRef = this.createOverlay();
    const dialogRef = new MenuOverlayRef(overlayRef);
    overlayRef.attach(viewPortal);
    overlayRef.backdropClick().subscribe(_ => dialogRef.close());
    return dialogRef;
  }

  select(text: string) {
    var viewPortal;
    switch(text) {
      case "play":
        this.enterPlay();
        break;
      case "artists":
        this.showArtists();
        break;
      case "tracks":
        this.showTracks();
        break;
      case "moods":
        this.showMoods();
        break;
      case "github":
        this.gotoGithub();
        break;
    }
  }

  enterPlay() {
    this.selectionEvent.emit('play')
  }

  showArtists() {
    this.selectionEvent.emit('artists')
  }

  showTracks() {
    this.selectionEvent.emit('tracks')
  }

  showMoods() {
    this.selectionEvent.emit('moods')
  }

  gotoGithub() {
    window.location.href = "https://github.com/darkjazz/moodplay"
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
