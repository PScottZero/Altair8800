import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AltairComponent } from './altair.component';

describe('AltairComponent', () => {
  let component: AltairComponent;
  let fixture: ComponentFixture<AltairComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AltairComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AltairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
