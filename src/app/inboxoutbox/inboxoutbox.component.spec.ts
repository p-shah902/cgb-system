import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InboxoutboxComponent } from './inboxoutbox.component';

describe('InboxoutboxComponent', () => {
  let component: InboxoutboxComponent;
  let fixture: ComponentFixture<InboxoutboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InboxoutboxComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InboxoutboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
