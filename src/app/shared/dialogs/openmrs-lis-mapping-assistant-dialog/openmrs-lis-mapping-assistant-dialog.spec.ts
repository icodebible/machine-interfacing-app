import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenmrsLisMappingAssistantDialog } from './openmrs-lis-mapping-assistant-dialog';

describe('OpenmrsLisMappingAssistantDialog', () => {
  let component: OpenmrsLisMappingAssistantDialog;
  let fixture: ComponentFixture<OpenmrsLisMappingAssistantDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OpenmrsLisMappingAssistantDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OpenmrsLisMappingAssistantDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
