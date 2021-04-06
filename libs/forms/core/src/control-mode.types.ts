import { DynControlConfig } from './control-config.interface';
import { DynControlParams } from './control-params.interfaces';

// edit|display|table|filter
export type DynControlMode = string; // Mode ID

// control overrides per mode handled by DynFormMode
export type DynControlModes<T extends string = DynControlMode> = {
  [K in T]: Partial<DynControlConfig>;
}

// general params overrides per mode handled by DynFormMode
export type DynModeParams<T extends string = DynControlMode> = {
  [K in T]: Partial<DynControlParams>;
}

// general config overrides per mode+control handled by DynFormMode
export type DynModeControls<T extends string = DynControlMode> = {
  [K in T]: DynControlConfig[];
}
