import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CbgComponent } from './cbg.component';

describe('CbgComponent', () => {
  let component: CbgComponent;
  let fixture: ComponentFixture<CbgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CbgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CbgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
