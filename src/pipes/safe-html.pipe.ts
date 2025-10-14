import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'stripHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): string {
    if (!value) return '';
    // return this.sanitizer.bypassSecurityTrustHtml(value);
    return value.replace(/<\/?[^>]+(>|$)/g, '');
  }
}