import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalActionDialog } from './approval-action-dialog';

describe('ApprovalActionDialog', () => {
  let component: ApprovalActionDialog;
  let fixture: ComponentFixture<ApprovalActionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalActionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalActionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
