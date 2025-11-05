import {Pipe, PipeTransform} from '@angular/core';
import {formatDistanceToNow} from 'date-fns';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // formatDistanceToNow works correctly with Date objects
    // Date objects are automatically in local time, so no conversion needed
    return formatDistanceToNow(date, {addSuffix: true});
  }
}
