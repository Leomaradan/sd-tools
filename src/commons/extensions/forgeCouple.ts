export interface IForgeCouple {
  background?: 'First Line' | 'Last Line' | 'None' | null;
  background_weight?: null | number;
  common_debug?: boolean | null;
  common_parser?: '< >' | '{ }' | 'off' | null;
  direction?: 'Horizontal' | 'Vertical' | null;
  mapping?: Array<any> | null;
  mode: 'Advanced' | 'Basic' | 'Mask';
  separator?: string;
}

export type IForgeCoupleQuery = [
  true,
  true,
  mode: 'Advanced' | 'Basic' | 'Mask',
  separator: string,
  direction: 'Horizontal' | 'Vertical' | null,
  background: 'First Line' | 'Last Line' | 'None' | null,
  background_weight: null | number,
  mapping: Array<any> | null,
  common_parser: '< >' | '{ }' | 'off' | null,
  common_debug: boolean | null
];

/*
enable: Boolean = true
disable_hr: Boolean = true | false
mode: String = "Basic" | "Advanced" | "Mask"
separator: String = "..."
direction: String = "Horizontal" | "Vertical" | null
background: String = "None" | "First Line" | "Last Line" | null
background_weight: Number = 0.1 ~ 1.5 | null
mapping: Array = Array[] | Object[] | null
common_parser: String = "off" | "{ }" | "< >" | null
common_debug: Boolean = true | false | null
*/

export const FORGE_COUPLE_URL = 'https://github.com/Haoming02/sd-forge-couple';
