import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {getCkEditorToken} from '../utils/api/api';

@Injectable({
  providedIn: 'root'
})
export class EditorService {

  constructor(private http: HttpClient) {
  }

  getEditorToken() {
    return this.http.get(getCkEditorToken)
  }

}
