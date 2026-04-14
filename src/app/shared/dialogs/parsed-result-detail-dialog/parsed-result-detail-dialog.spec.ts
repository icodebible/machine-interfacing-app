import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParsedResultDetailDialog } from './parsed-result-detail-dialog';

describe('ParsedResultDetailDialog', () => {
  let component: ParsedResultDetailDialog;
  let fixture: ComponentFixture<ParsedResultDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParsedResultDetailDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParsedResultDetailDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
