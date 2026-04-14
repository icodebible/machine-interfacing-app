import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutboundQueue } from './outbound-queue';

describe('OutboundQueue', () => {
  let component: OutboundQueue;
  let fixture: ComponentFixture<OutboundQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundQueue]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundQueue);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
