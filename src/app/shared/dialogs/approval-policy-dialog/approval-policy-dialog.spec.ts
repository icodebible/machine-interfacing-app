import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalPolicyDialog } from './approval-policy-dialog';

describe('ApprovalPolicyDialog', () => {
  let component: ApprovalPolicyDialog;
  let fixture: ComponentFixture<ApprovalPolicyDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalPolicyDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalPolicyDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
