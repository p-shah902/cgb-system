import { AppConfig } from '../../models/app.config';

// Re-export AppConfig type for convenience
export type { AppConfig } from '../../models/app.config';

// This will be populated before the app bootstraps
let loadedConfig: AppConfig | null = null;

// Function to set the loaded config (called from main.ts before bootstrap)
export function setAppConfig(config: AppConfig): void {
  loadedConfig = config;
}

// Function to get config
function getAppConfig(): AppConfig {
  if (!loadedConfig) {
    throw new Error('App config not loaded. Make sure config is loaded before bootstrapping the application.');
  }
  return loadedConfig;
}

// Export config object - simple direct access since it's loaded before bootstrap
export const appConfig: AppConfig = {
  get production() { return getAppConfig().production; },
  get apiUrl() { return getAppConfig().apiUrl; },
  get ckEditorLicenceKey() { return getAppConfig().ckEditorLicenceKey; },
  get ckeditorTokenUrl() { return getAppConfig().ckeditorTokenUrl; },
  get ckeditorSocketUrl() { return getAppConfig().ckeditorSocketUrl; }
} as AppConfig;

// Also export as environment for easier migration
export const environment = appConfig;

