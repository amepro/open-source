import { Type } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { DynBaseConfig } from './config.types';
import { DynControlMode } from './control-mode.types';
import { DynControlType, DynInstanceType } from './control.types';
import { DynControl } from './dyn-control.class';
import { DynBaseProvider } from './dyn-providers';

export type AbstractDynControl = DynControl<DynControlMode, any, DynBaseConfig, AbstractControl>;

export interface DynLazyControl extends DynBaseProvider {
  control: DynControlType;
  instance: DynInstanceType;
  // resolved in DynFormRegistry
  useFactory: () => Type<AbstractDynControl>;
  component?: Type<AbstractDynControl>;
}

export interface DynInjectedControl extends DynBaseProvider {
  control: DynControlType;
  instance: DynInstanceType;
  component: Type<AbstractDynControl>;
}

export type DynControlProvider = DynLazyControl | DynInjectedControl;

// type guard
export function isDynLazyControl(
  provider: DynControlProvider
): provider is DynLazyControl {
  return Object.prototype.hasOwnProperty.call(provider, 'useFactory');
}
