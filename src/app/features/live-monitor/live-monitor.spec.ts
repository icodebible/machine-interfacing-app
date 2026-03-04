import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMonitor } from './live-monitor';

describe('LiveMonitor', () => {
  let component: LiveMonitor;
  let fixture: ComponentFixture<LiveMonitor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveMonitor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveMonitor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
