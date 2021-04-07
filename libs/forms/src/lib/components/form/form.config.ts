import {
  DynBaseConfig,
  DynConfig,
  DynModeControls,
  DynModeParams,
  DynControlMode,
} from '@myndpm/dyn-forms/core';

// typed config with the supported modes
export interface DynFormConfig<M extends DynControlMode = DynControlMode> {
  modeParams?: DynModeParams<M>; // default params per mode
  modes?: DynModeControls<M>; // default config per mode+control
  controls: Array<DynBaseConfig<M> | DynConfig<M>>;
}