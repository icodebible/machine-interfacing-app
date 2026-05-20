import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryHistoryDetailDialog } from './delivery-history-detail-dialog';

describe('DeliveryHistoryDetailDialog', () => {
  let component: DeliveryHistoryDetailDialog;
  let fixture: ComponentFixture<DeliveryHistoryDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryHistoryDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryHistoryDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
