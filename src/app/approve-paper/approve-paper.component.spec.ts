import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovePaperComponent } from './approve-paper.component';

describe('ApprovePaperComponent', () => {
  let component: ApprovePaperComponent;
  let fixture: ComponentFixture<ApprovePaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovePaperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovePaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
