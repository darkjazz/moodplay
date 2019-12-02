import { Component, ViewChild, Injectable, Inject, Output, EventEmitter } from '@angular/core';
import { MatMenu }       from '@angular/material/menu';
import { MatButton }        from '@angular/material/button';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal }  from '@angular/cdk/portal';
import { MenuItem }         from '../shared/menuitem';
import { MenuOverlayRef }   from '../shared/overlayref';
import { EntryComponent }   from './entry.component';
import { InfoComponent }    from './info.component';
import { HelpComponent }    from './help.component';
import { PartyComponent }    from './party.component';

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
  { "text": "change name", "icon": "edit", "select": 1 },
  { "text": "create party", "icon": "add_circle", "select": 2 },
  { "text": "help", "icon": "help", "select": 3 },
  { "text": "about", "icon": "info", "select": 4 },
  { "text": "github", "icon": "cloud_download", "select": 5 }
];

@Component({
  selector: 'ml-menu',
  templateUrl: 'menu.component.html',
  styleUrls: ['menu.component.scss'],
})
@Injectable()
export class Menu {
  @ViewChild('matMenu') menu: MatMenu;
  @Output() selectionEvent = new EventEmitter<string>();
  items: MenuItem[];
  constructor(private overlay: Overlay) {
    this.items = new Array<MenuItem>();
    ITEMS.forEach(item => {
      this.items.push(item as MenuItem)
    })
  }

  showOverlay(select: Number) {
    var viewPortal;
    switch(select) {
      case 1:
        viewPortal = new ComponentPortal(EntryComponent);
        break;
      case 2:
        viewPortal = new ComponentPortal(PartyComponent);
        break;
      case 3:
        viewPortal = new ComponentPortal(HelpComponent);
        break;
      case 4:
        viewPortal = new ComponentPortal(InfoComponent);
        break;
    }
    const overlayRef = this.createOverlay();
    const dialogRef = new MenuOverlayRef(overlayRef);
    overlayRef.attach(viewPortal);
    overlayRef.backdropClick().subscribe(_ => dialogRef.close());
    return dialogRef;
  }

  select(select: Number) {
    var viewPortal;
    if (select == 5) this.gotoGithub();
    else this.showOverlay(select)
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
