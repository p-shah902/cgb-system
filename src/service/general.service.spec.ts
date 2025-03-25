import { TestBed } from '@angular/core/testing';
import { Generalervice } from './general.service';

describe('DepartmentService', () => {
  let service: Generalervice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Generalervice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
