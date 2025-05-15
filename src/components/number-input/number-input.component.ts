import {
  Component, forwardRef, Input,
  OnInit, HostListener, ElementRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-number-input',
  templateUrl: './number-input.component.html',
  standalone: true,
  imports: [CommonModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NumberInputComponent),
    multi: true
  }]
})

export class NumberInputComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() id: string = '';
  @Input() inputClass: string = '';
  @Input() disabled = false;
  @Input() readonly: boolean = false;

  rawValue: number | null = null;
  inputText: string = ''; // What the user types

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {}

  writeValue(value: number): void {
    this.rawValue = value;
    this.inputText = value != null ? this.formatNumber(value) : '';
  }


  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
  }

  onInput(event: any): void {
    const raw = event.target.value.replace(/,/g, '');
    this.inputText = raw;

    const parsed = parseFloat(raw);
    this.rawValue = isNaN(parsed) ? null : parsed;
    this.onChange(this.rawValue);
  }

  @HostListener('blur')
  onBlur(): void {
    if (this.rawValue != null) {
      this.inputText = this.formatNumber(this.rawValue);
    } else {
      this.inputText = '';
    }
    this.onTouched();
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
