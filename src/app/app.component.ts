import { Component } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Overlay, OverlayConfig } from '@angular/cdk/overlay';
import { MenuOverlayRef }   from './shared/overlayref';
import { ComponentPortal }  from '@angular/cdk/portal';
import { EntryComponent }    from './components/entry.component';
import { User } from './shared/models';
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

  constructor(
    private overlay: Overlay,
    private moodplayServive: MoodplayService
  ) { }

  ngOnInit(): void {
    // if (!this.user) {
    //   this.showOverlay()
    // }
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
