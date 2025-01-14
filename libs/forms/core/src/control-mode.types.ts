import { DynControlConfig } from './control-config.types';

// edit|display|table|filter
export type DynControlMode = string; // Mode ID

// config overrides per mode, handled by DynFormMode
export type DynControlModes<TMode extends string = DynControlMode> = {
  [K in TMode]?: Partial<DynControlConfig>;
}
