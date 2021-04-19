import { AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { DynBaseHandler } from './dyn-providers';

/**
 * triggers configuration
 */
 export interface DynControlTriggers {
  invalidOn?: 'touched' | 'submitted';
  updateOn?: 'change' | 'blur' | 'submit'; // Angular FormHooks
}

/**
 * validators provided in the module individually
 */
export type DynValidatorProvider = DynBaseHandler<ValidatorFn>;
export type DynAsyncValidatorProvider = DynBaseHandler<AsyncValidatorFn>;