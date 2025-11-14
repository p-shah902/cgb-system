import { APP_INITIALIZER, FactoryProvider } from '@angular/core';
import { AppConfigService, APP_CONFIG, AppConfig } from './app-config.service';
import { setAppConfigService } from './app-config';

export function appInitFactory(appConfigService: AppConfigService): () => Promise<void> {
  return () => {
    return appConfigService.loadConfig().then(config => {
      // Store service instance for backward compatibility exports
      setAppConfigService(appConfigService);
      // Config is loaded and stored in the service
      console.log('App config loaded successfully');
    }).catch(error => {
      console.error('Failed to initialize app config:', error);
      throw error;
    });
  };
}

export function appConfigFactory(appConfigService: AppConfigService): AppConfig {
  return appConfigService.getConfig();
}

export const APP_INITIALIZER_PROVIDER: FactoryProvider = {
  provide: APP_INITIALIZER,
  useFactory: appInitFactory,
  deps: [AppConfigService],
  multi: true
};

export const APP_CONFIG_PROVIDER: FactoryProvider = {
  provide: APP_CONFIG,
  useFactory: appConfigFactory,
  deps: [AppConfigService]
};

