import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SysInfoComponent } from './sys-info.component';

describe('SysInfoComponent', () => {
  let component: SysInfoComponent;
  let fixture: ComponentFixture<SysInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SysInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SysInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
