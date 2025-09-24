import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchPaperListComponent } from './batch-paper-list.component';

describe('PaperListComponent', () => {
  let component: BatchPaperListComponent;
  let fixture: ComponentFixture<BatchPaperListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchPaperListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatchPaperListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
