import { Component, ViewChild, Injectable, Inject, Output, EventEmitter } from '@angular/core';
import { MatSidenav }       from '@angular/material/sidenav';
import { MatButton }        from '@angular/material/button';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal }  from '@angular/cdk/portal';
import { MenuItem }         from '../shared/menuitem';
import { MenuOverlayRef }   from '../shared/overlayref';

interface MenuOverlayConfig {
    panelClass?: string;
    hasBackdrop?: boolean;
    backdropClass?: string;
}

const ITEMS = [
  { "text": "artists", "icon": "record_voice_over" },
  { "text": "tracks", "icon": "music_video" },
  { "text": "github", "icon": "cloud_download" }
];

const DEFAULT_CONFIG: MenuOverlayConfig = {
  hasBackdrop: true,
  backdropClass: 'dark-backdrop',
  panelClass: 'overlay-panel'
}

@Component({
  selector: 'ml-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
})
@Injectable()
export class Menu {
  @ViewChild('sidenav') sidenav: MatSidenav;
  // @ViewChild('navbtn') navbtn: MatButton;
  @Output() selectionEvent = new EventEmitter<string>();
  items: MenuItem[];
  constructor(private overlay: Overlay) {
    this.items = new Array<MenuItem>();
    ITEMS.forEach(item => {
      this.items.push(item as MenuItem)
    })
  }

  open() {
    this.sidenav.open();
  }

  close() {
    this.sidenav.close();
  }

  select(text: string) {
    var viewPortal;
    switch(text) {
      case "artists":
        this.showArtists();
        break;
      case "tracks":
        this.showTracks();
        break;
      case "github":
        this.gotoGithub();
        break;
    }
  }

  showArtists() {
    this.selectionEvent.emit('artists')
  }

  showTracks() {
    this.selectionEvent.emit('tracks')
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
