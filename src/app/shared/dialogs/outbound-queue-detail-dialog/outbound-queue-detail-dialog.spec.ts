import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutboundQueueDetailDialog } from './outbound-queue-detail-dialog';

describe('OutboundQueueDetailDialog', () => {
  let component: OutboundQueueDetailDialog;
  let fixture: ComponentFixture<OutboundQueueDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundQueueDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundQueueDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
