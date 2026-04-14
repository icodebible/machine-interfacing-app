import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MappingDialog } from './mapping-dialog';

describe('MappingDialog', () => {
  let component: MappingDialog;
  let fixture: ComponentFixture<MappingDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MappingDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MappingDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
