import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nuevolibro } from './nuevolibro';

describe('Nuevolibro', () => {
  let component: Nuevolibro;
  let fixture: ComponentFixture<Nuevolibro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nuevolibro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nuevolibro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
