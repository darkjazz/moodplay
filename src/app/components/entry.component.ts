import { Component, ElementRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MoodplayService } from '../services/moodplay.service';
import { User } from '../shared/models';

@Component({
  selector: 'entry',
  templateUrl: 'entry.component.html',
  styleUrls: ['entry.component.scss']
})
export class EntryComponent {

  private element;
  username: string;

  constructor(private el: ElementRef, private moodplayService: MoodplayService) {
      this.element = el.nativeElement;
      this.username = moodplayService.getUser().name;
  }

  close() {
    if (this.username && this.username != this.moodplayService.getUser().name) {
      this.moodplayService.changeUserName(this.username);
    }
    //this.element.remove();
    window.location.reload();
  }

}
