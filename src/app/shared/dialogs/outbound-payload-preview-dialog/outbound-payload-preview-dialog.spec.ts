import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutboundPayloadPreviewDialog } from './outbound-payload-preview-dialog';

describe('OutboundPayloadPreviewDialog', () => {
  let component: OutboundPayloadPreviewDialog;
  let fixture: ComponentFixture<OutboundPayloadPreviewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutboundPayloadPreviewDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutboundPayloadPreviewDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
