import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalAddComponent } from './internal-add.component';

describe('InternalAddComponent', () => {
  let component: InternalAddComponent;
  let fixture: ComponentFixture<InternalAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternalAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
