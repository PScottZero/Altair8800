import { TestBed } from '@angular/core/testing';

import { EmulatorService } from './emulator.service';

describe('EmulatorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EmulatorService = TestBed.get(EmulatorService);
    expect(service).toBeTruthy();
  });
});
