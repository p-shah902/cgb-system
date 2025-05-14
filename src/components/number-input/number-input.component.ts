import {
  Component, forwardRef, Input,
  OnInit, HostListener, ElementRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-number-input',
  templateUrl: './number-input.component.html',
  standalone: true,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NumberInputComponent),
    multi: true
  }]
})

export class NumberInputComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() id: string = '';
  @Input() disabled = false;

  rawValue: number | null = null;

  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private elRef: ElementRef) {}

  ngOnInit(): void {}

  writeValue(value: number): void {
    this.rawValue = value;
    this.updateView();
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
    const input = event.target.value.replace(/,/g, '');
    const num = parseFloat(input);

    this.rawValue = isNaN(num) ? null : num;
    this.onChange(this.rawValue);
    this.updateView();
  }

  private updateView(): void {
    const el = this.elRef.nativeElement.querySelector('input');
    if (el) {
      el.value = this.rawValue != null ? this.formatNumber(this.rawValue) : '';
    }
  }

  private formatNumber(value: number): string {
    return value.toLocaleString('en-US'); // "10,20,300" Indian style
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
  }
}
