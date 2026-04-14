import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StarterTemplateInfoDialog } from './starter-template-info-dialog';

describe('StarterTemplateInfoDialog', () => {
  let component: StarterTemplateInfoDialog;
  let fixture: ComponentFixture<StarterTemplateInfoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarterTemplateInfoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StarterTemplateInfoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
