import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatepaperComponent } from './createpaper.component';

describe('CreatepaperComponent', () => {
  let component: CreatepaperComponent;
  let fixture: ComponentFixture<CreatepaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatepaperComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatepaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
