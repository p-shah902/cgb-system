import {Pipe, PipeTransform} from '@angular/core';
import {formatDistanceToNow} from 'date-fns';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    if (!value) return '';

    let date: Date;
    
    if (typeof value === 'string') {
      // If the string doesn't have timezone info (no Z or +/- offset), treat it as UTC
      // API dates like "2025-11-25T11:36:39.03" are typically UTC
      // Check if it ends with Z or has timezone offset (+/-HH:MM or +/-HHMM)
      const hasTimezone = value.endsWith('Z') || 
                          /[+-]\d{2}:?\d{2}$/.test(value) ||
                          value.includes('GMT') ||
                          value.includes('UTC');
      
      if (!hasTimezone) {
        // Append 'Z' to indicate UTC timezone
        date = new Date(value + 'Z');
      } else {
        date = new Date(value);
      }
    } else {
      date = value;
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // formatDistanceToNow works correctly with Date objects
    // The Date object will be in local time, which is what we want for display
    return formatDistanceToNow(date, {addSuffix: true});
  }
}
