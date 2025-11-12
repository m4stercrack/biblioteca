import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ImgbbService {
  private apiKey = 'f2f70917fa3dcb7f0031221bafc3516a'; //  reemplaza con tu key de ImgBB

  constructor(private http: HttpClient) { }

  uploadImage(image: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    return this.http.post(`https://api.imgbb.com/1/upload?key=${this.apiKey}`, formData);
  }
}
