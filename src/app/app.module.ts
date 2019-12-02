import { BrowserModule } from '@angular/platform-browser';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule, MatMenuModule, MatIconModule, MatButtonModule, MatInputModule } from '@angular/material';
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
import { InfoComponent } from './components/info.component';
import { HelpComponent } from './components/help.component';
import { PartyComponent } from './components/party.component';

@NgModule({
  declarations: [
    AppComponent,
    Menu,
    HeaderComponent,
    GraphicsComponent,
    EntryComponent,
    InfoComponent,
    HelpComponent,
    PartyComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    JsonpModule,
    FlexLayoutModule,
    MatDialogModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    BrowserAnimationsModule,
    OverlayModule,
    PortalModule
  ],
  providers: [ MoodplayService, DeezerService, PlayerService, FeatureService ],
  entryComponents: [ EntryComponent, InfoComponent, HelpComponent, PartyComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
