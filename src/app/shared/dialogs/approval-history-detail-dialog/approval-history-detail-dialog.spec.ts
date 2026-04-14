import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalHistoryDetailDialog } from './approval-history-detail-dialog';

describe('ApprovalHistoryDetailDialog', () => {
  let component: ApprovalHistoryDetailDialog;
  let fixture: ComponentFixture<ApprovalHistoryDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalHistoryDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalHistoryDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
