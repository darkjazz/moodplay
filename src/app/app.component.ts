import { Component } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Moodplay';
  selectionVariable = 'play';

  onSelected(text: string) {
    this.selectionVariable = text;
  }
}
