import { TestBed } from '@angular/core/testing';
import { PaperConfigService } from './paper-config.service';

describe('PaperConfigService', () => {
  let service: PaperConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaperConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
