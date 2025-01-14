import {
  DynBaseConfig,
  DynConfig,
  DynControlMode,
  DynControlType,
  DynPartialControlConfig,
  DynPartialGroupConfig,
} from '@myndpm/dyn-forms/core';
import {
  DynMatArrayComponent,
  DynMatArrayParams,
  DynMatCardComponent,
  DynMatCardParams,
  DynMatCheckboxComponent,
  DynMatCheckboxParams,
  DynMatContainerComponent,
  DynMatContainerParams,
  DynMatDatepickerComponent,
  DynMatDatepickerParams,
  DynMatDividerComponent,
  DynMatDividerParams,
  DynMatInputComponent,
  DynMatInputParams,
  DynMatMulticheckboxComponent,
  DynMatMulticheckboxParams,
  DynMatRadioComponent,
  DynMatRadioParams,
  DynMatSelectComponent,
  DynMatSelectParams,
} from './components';

// type overloads
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatArrayComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatArrayParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatCardComponent.dynControl,
  partial: DynPartialGroupConfig<M, Partial<DynMatCardParams>>
): DynBaseConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatCheckboxComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatCheckboxParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatContainerComponent.dynControl,
  partial: DynPartialGroupConfig<M, Partial<DynMatContainerParams>>
): DynBaseConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatDatepickerComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatDatepickerParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatDividerComponent.dynControl,
  partial: DynPartialGroupConfig<M, Partial<DynMatDividerParams>>
): DynBaseConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatInputComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatInputParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatMulticheckboxComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatMulticheckboxParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatRadioComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatRadioParams>>
): DynConfig<M>;
export function createMatConfig<M extends DynControlMode>(
  type: typeof DynMatSelectComponent.dynControl,
  partial: DynPartialControlConfig<M, Partial<DynMatSelectParams>>
): DynConfig<M>;

// factory
export function createMatConfig<M extends DynControlMode>(
  type: DynControlType,
  partial: any,
): DynBaseConfig<M> {
  switch (type) {
    // containers
    case DynMatArrayComponent.dynControl:
      return DynMatArrayComponent.createConfig(partial);

    case DynMatCardComponent.dynControl:
      return DynMatCardComponent.createConfig(partial);

    case DynMatContainerComponent.dynControl:
      return DynMatContainerComponent.createConfig(partial);

    case DynMatDividerComponent.dynControl:
      return DynMatDividerComponent.createConfig(partial);

    // controls
    case DynMatCheckboxComponent.dynControl:
      return DynMatCheckboxComponent.createConfig(partial);

    case DynMatDatepickerComponent.dynControl:
      return DynMatDatepickerComponent.createConfig(partial);

    case DynMatMulticheckboxComponent.dynControl:
      return DynMatMulticheckboxComponent.createConfig(partial);

    case DynMatSelectComponent.dynControl:
      return DynMatSelectComponent.createConfig(partial);

    case DynMatRadioComponent.dynControl:
      return DynMatRadioComponent.createConfig(partial);

    case DynMatInputComponent.dynControl:
    default:
      return DynMatInputComponent.createConfig(partial);
  }
}
