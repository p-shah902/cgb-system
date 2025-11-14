import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from '../../models/app.config';

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private http = inject(HttpClient);
  private config: AppConfig | null = null;

  async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      this.config = await firstValueFrom(
        this.http.get<AppConfig>('/app-config.json')
      );
      return this.config;
    } catch (error) {
      console.error('Failed to load app-config.json:', error);
      throw error;
    }
  }

  getConfig(): AppConfig {
    if (!this.config) {
      throw new Error('Config has not been loaded yet. Ensure APP_INITIALIZER is configured correctly.');
    }
    return this.config;
  }
}

