import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionariesEditComponent } from './dictionaries-edit.component';

describe('DictionariesEditComponent', () => {
  let component: DictionariesEditComponent;
  let fixture: ComponentFixture<DictionariesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DictionariesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionariesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
