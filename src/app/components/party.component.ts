import { Component, ElementRef } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MoodplayService } from '../services/moodplay.service';
import { User } from '../shared/models';

@Component({
  selector: 'party',
  templateUrl: 'party.component.html',
  styleUrls: ['party.component.scss']
})
export class PartyComponent {

  user: User;

  constructor(private moodplayService: MoodplayService) {
      this.user = moodplayService.getUser();
  }

  create() {
    this.moodplayService.createUserParty(this.user)
      .then(party => {
        window.location.reload();
      })
  }

  cancel() {
    window.location.reload();
  }

}
