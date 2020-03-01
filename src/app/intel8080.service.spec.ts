import { TestBed } from '@angular/core/testing';

import { Intel8080Service } from './intel8080.service';

describe('EmulatorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: Intel8080Service = TestBed.get(Intel8080Service);
    expect(service).toBeTruthy();
  });
});
