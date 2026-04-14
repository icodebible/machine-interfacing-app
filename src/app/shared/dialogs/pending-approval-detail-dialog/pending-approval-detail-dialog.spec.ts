import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingApprovalDetailDialog } from './pending-approval-detail-dialog';

describe('PendingApprovalDetailDialog', () => {
  let component: PendingApprovalDetailDialog;
  let fixture: ComponentFixture<PendingApprovalDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PendingApprovalDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingApprovalDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
