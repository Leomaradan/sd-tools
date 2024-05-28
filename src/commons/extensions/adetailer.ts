export interface IAdetailer {
  ad_denoising_strength?: number;
  ad_inpaint_height?: number;
  ad_inpaint_width?: number;
  ad_model: string;
  ad_negative_prompt?: string;
  ad_prompt?: string;
  ad_use_inpaint_width_height?: boolean;
}

export const ADTAILER_URL = 'https://github.com/Bing-su/adetailer.git';
