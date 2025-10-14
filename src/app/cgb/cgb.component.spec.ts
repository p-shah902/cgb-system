import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CgbComponent } from './cgb.component';

describe('CgbComponent', () => {
  let component: CgbComponent;
  let fixture: ComponentFixture<CgbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CgbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CgbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
