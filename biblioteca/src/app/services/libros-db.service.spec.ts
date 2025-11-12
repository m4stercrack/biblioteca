import { TestBed } from '@angular/core/testing';

import { LibrosDbService } from './libros-db.service';

describe('LibrosDbService', () => {
  let service: LibrosDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LibrosDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
