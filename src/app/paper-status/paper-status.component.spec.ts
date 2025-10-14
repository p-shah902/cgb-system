import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaperStatusComponent } from './paper-status.component';

describe('PaperStatusComponent', () => {
  let component: PaperStatusComponent;
  let fixture: ComponentFixture<PaperStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaperStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaperStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
