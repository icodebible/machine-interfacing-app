import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutingRuleDialog } from './routing-rule-dialog';

describe('RoutingRuleDialog', () => {
  let component: RoutingRuleDialog;
  let fixture: ComponentFixture<RoutingRuleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutingRuleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoutingRuleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
