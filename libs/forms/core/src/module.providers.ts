import { Provider } from '@angular/core';
import { DynLogDriver, DynLogger, DynLogLevel, DYN_LOG_LEVEL } from '@myndpm/dyn-forms/logger';
import { DynControlCondition, DynControlMatcher } from './control-matchers.types';
import { DynControlFunction } from './control-params.types';
import { DynControlProvider } from './control-provider.types';
import { DynControlAsyncValidator, DynControlValidator, DynErrorHandler } from './control-validation.types';
import { mapPriority } from './dyn-providers';
import { DynFormFactory } from './form-factory.service';
import { DynFormHandlers } from './form-handlers.service';
import { DynFormRegistry } from './form-registry.service';
import {
  DYN_ASYNCVALIDATORS_TOKEN,
  DYN_CONTROLS_TOKEN,
  DYN_ERROR_HANDLERS_TOKEN,
  DYN_FUNCTIONS_TOKEN,
  DYN_MATCHERS_TOKEN,
  DYN_MATCHER_CONDITIONS_TOKEN,
  DYN_VALIDATORS_TOKEN,
} from './form.tokens';

export interface DynModuleProviders {
  providers?: Provider[];
  controls?: DynControlProvider[];
  errorHandlers?: DynErrorHandler[];
  functions?: DynControlFunction[];
  validators?: DynControlValidator[];
  asyncValidators?: DynControlAsyncValidator[];
  matchers?: DynControlMatcher[];
  conditions?: DynControlCondition[];
  priority?: number;
}

// utility used by DynFormsModule.forFeature
export function getModuleProviders(args?: DynModuleProviders): Provider[] {
  return [
    {
      provide: DYN_LOG_LEVEL,
      useValue: DynLogLevel.Fatal,
    },
    DynLogDriver,
    DynLogger,
    DynFormRegistry,
    DynFormHandlers,
    DynFormFactory,
    ...args?.providers ?? [],
    ...args?.controls?.map(mapPriority(args?.priority)).map((control) => ({
      provide: DYN_CONTROLS_TOKEN,
      useValue: control,
      multi: true,
    })) ?? [],
    ...args?.errorHandlers?.map(mapPriority(args?.priority)).map((errorHandler) => ({
      provide: DYN_ERROR_HANDLERS_TOKEN,
      useValue: errorHandler,
      multi: true,
    })) ?? [],
    ...args?.functions?.map(mapPriority(args?.priority)).map((fn) => ({
      provide: DYN_FUNCTIONS_TOKEN,
      useValue: fn,
      multi: true,
    })) ?? [],
    ...args?.validators?.map(mapPriority(args?.priority)).map((validator) => ({
      provide: DYN_VALIDATORS_TOKEN,
      useValue: validator,
      multi: true,
    })) ?? [],
    ...args?.asyncValidators?.map(mapPriority(args?.priority)).map((asyncValidator) => ({
      provide: DYN_ASYNCVALIDATORS_TOKEN,
      useValue: asyncValidator,
      multi: true,
    })) ?? [],
    ...args?.matchers?.map(mapPriority(args?.priority)).map((matcher) => ({
      provide: DYN_MATCHERS_TOKEN,
      useValue: matcher,
      multi: true,
    })) ?? [],
    ...args?.conditions?.map(mapPriority(args?.priority)).map((condition) => ({
      provide: DYN_MATCHER_CONDITIONS_TOKEN,
      useValue: condition,
      multi: true,
    })) ?? [],
  ];
}
