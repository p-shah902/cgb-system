import {Directive, ElementRef, Input, OnChanges} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

@Directive({
  standalone: true,
  selector: '[safeHtml]'
})
export class SafeHtmlDirective implements OnChanges {
  @Input() safeHtml?: string;

  constructor(private el: ElementRef, private sanitizer: DomSanitizer) {
  }

  ngOnChanges(): void {
    if (this.safeHtml) {
      const sanitizedContent: SafeHtml | any = this.sanitizer.bypassSecurityTrustHtml(this.safeHtml);
      this.el.nativeElement.innerHTML = sanitizedContent['changingThisBreaksApplicationSecurity'];
    }
  }
}
