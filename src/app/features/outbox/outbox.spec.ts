import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Outbox } from './outbox';

describe('Outbox', () => {
  let component: Outbox;
  let fixture: ComponentFixture<Outbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Outbox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Outbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
