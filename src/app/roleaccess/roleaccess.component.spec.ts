import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleaccessComponent } from './roleaccess.component';

describe('RoleaccessComponent', () => {
  let component: RoleaccessComponent;
  let fixture: ComponentFixture<RoleaccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleaccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleaccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
