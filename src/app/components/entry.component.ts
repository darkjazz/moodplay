import { Component, ElementRef } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'entry',
  templateUrl: 'entry.component.html',
  styleUrls: ['entry.component.scss']
})
export class EntryComponent {

  private element;

  constructor(private el: ElementRef) {
      this.element = el.nativeElement;
  }

  close() {
    this.element.remove();
  }

}
