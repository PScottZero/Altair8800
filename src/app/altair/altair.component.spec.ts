import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AltairComponent } from './altair.component';

describe('AltairComponent', () => {
  let component: AltairComponent;
  let fixture: ComponentFixture<AltairComponent>;

  beforeEach(async(() => {
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
