import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThresholdAddComponent } from './threshold-add.component';

describe('ThresholdAddComponent', () => {
  let component: ThresholdAddComponent;
  let fixture: ComponentFixture<ThresholdAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThresholdAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThresholdAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
