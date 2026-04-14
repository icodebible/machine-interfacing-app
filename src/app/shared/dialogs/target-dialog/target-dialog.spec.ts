import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TargetDialog } from './target-dialog';

describe('TargetDialog', () => {
  let component: TargetDialog;
  let fixture: ComponentFixture<TargetDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TargetDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
