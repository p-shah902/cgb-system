import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionariesListComponent } from './dictionaries-list.component';

describe('DictionariesListComponent', () => {
  let component: DictionariesListComponent;
  let fixture: ComponentFixture<DictionariesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DictionariesListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionariesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
