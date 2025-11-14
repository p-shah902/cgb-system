/// <reference types="@angular/localize" />

import { setAppConfig } from './app/core/app-config';
import { AppConfig } from './models/app.config';

// Load app-config.json before bootstrapping
async function loadAppConfig(): Promise<void> {
  try {
    const response = await fetch('/app-config.json');
    if (!response.ok) {
      throw new Error(`Failed to load app-config.json: ${response.status} ${response.statusText}`);
    }
    const config: AppConfig = await response.json();
    setAppConfig(config);
    console.log('App config loaded successfully');
  } catch (error) {
    console.error('Failed to load app-config.json:', error);
    throw error;
  }
}

// Load config first, then dynamically import and bootstrap the application
// This ensures modules that depend on config are only loaded after config is ready
loadAppConfig()
  .then(async () => {
    // Dynamic imports ensure these modules are only evaluated after config is loaded
    const { bootstrapApplication } = await import('@angular/platform-browser');
    const { appConfig } = await import('./app/app.config');
    const { AppComponent } = await import('./app/app.component');
    
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  })
  .catch((err) => {
    console.error('Failed to initialize application:', err);
  });
