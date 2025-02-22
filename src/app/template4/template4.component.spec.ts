import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Template4Component } from './template4.component';

describe('Template4Component', () => {
  let component: Template4Component;
  let fixture: ComponentFixture<Template4Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Template4Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Template4Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
