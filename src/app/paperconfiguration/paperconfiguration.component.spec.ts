import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaperconfigurationComponent } from './paperconfiguration.component';

describe('PaperconfigurationComponent', () => {
  let component: PaperconfigurationComponent;
  let fixture: ComponentFixture<PaperconfigurationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaperconfigurationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaperconfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
