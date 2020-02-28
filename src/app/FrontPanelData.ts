export const LED_NAMES = [
  'INTE', 'PROT', 'MEMR', 'INP',
  'MI', 'OUT', 'HLTA', 'STACK',
  'WO', 'INT',
  'D7', 'D6', 'D5', 'D4',
  'D3', 'D2', 'D1', 'D0',
  'WAIT', 'HLDA',
  'A15', 'A14', 'A13', 'A12',
  'A11', 'A10', 'A9', 'A8',
  'A7', 'A6', 'A5', 'A4',
  'A3', 'A2', 'A1', 'A0',
];

export const SWITCH_NAMES = [
  'A15', 'A14', 'A13', 'A12',
  'A11', 'A10', 'A9', 'A8',
  'A7', 'A6', 'A5', 'A4',
  'A3', 'A2', 'A1', 'A0',
  'ON_OFF',
  'STOP_RUN', 'SINGLE_STEP',
  'EXAMINE', 'DEPOSIT', 'RESET_CLR',
  'PROTECT', 'AUX1', 'AUX2',
];

export const BINARY_SWITCHES = SWITCH_NAMES.slice(0, 17);
