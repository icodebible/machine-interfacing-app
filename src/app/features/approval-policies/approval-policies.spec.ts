import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalPolicies } from './approval-policies';

describe('ApprovalPolicies', () => {
  let component: ApprovalPolicies;
  let fixture: ComponentFixture<ApprovalPolicies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalPolicies]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalPolicies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
