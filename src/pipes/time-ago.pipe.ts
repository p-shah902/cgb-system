import {Pipe, PipeTransform} from '@angular/core';
import {formatDistanceToNow} from 'date-fns';
import {toZonedTime} from 'date-fns-tz';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;

    // Convert from UTC to local timezone
    const localDate = toZonedTime(date, Intl.DateTimeFormat().resolvedOptions().timeZone);

    return formatDistanceToNow(localDate, {addSuffix: true});
  }
}
