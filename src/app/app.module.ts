import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatMenuModule, MatIconModule, MatButtonModule } from '@angular/material';
import { BrowserAnimationsModule }  from '@angular/platform-browser/animations';
import { OverlayModule }            from '@angular/cdk/overlay';
import { PortalModule }             from '@angular/cdk/portal';

import { AppComponent } from './app.component';
import { Menu } from './components/menu.component';
import { MoodplayService } from './services/moodplay.service';
import { DeezerService } from './services/deezer.service';
import { PlayerService } from './services/player.service';
import { FeatureService } from './services/feature.service';
import { HeaderComponent } from './components/header.component';
import { GraphicsComponent } from './components/graphics.component';
import { EntryComponent } from './components/entry.component';

@NgModule({
  declarations: [
    AppComponent,
    Menu,
    HeaderComponent,
    GraphicsComponent,
    EntryComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    JsonpModule,
    FlexLayoutModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    BrowserAnimationsModule,
    OverlayModule,
    PortalModule
  ],
  providers: [ MoodplayService, DeezerService, PlayerService, FeatureService ],
  entryComponents: [ EntryComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
