import { TestBed } from '@angular/core/testing';

import { Intel8080cycleService } from './intel8080cycle.service';

describe('Intel8080cycleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Intel8080cycleService = TestBed.get(Intel8080cycleService);
    expect(service).toBeTruthy();
  });
});
