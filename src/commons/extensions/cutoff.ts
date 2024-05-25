import { Config } from '../config';

export interface ICutOff {
  tokens: string[];
  weight?: number;
}

export const getCutOffTokens = (prompt: string): string[] => {
  let tokens = prompt.split(/,|BREAK|SEP|SKIP/i);
  tokens = tokens.map((token) => token.trim());

  const autoTokens = Array.from(Config.get('cutoffTokens'));

  return tokens.filter((token) => {
    return autoTokens.some((autoToken) => {
      const tokenLower = token.toLowerCase();
      const autoTokenLower = autoToken.toLowerCase();
      return tokenLower.startsWith(autoTokenLower) || tokenLower.endsWith(autoTokenLower) || tokenLower.includes(` ${autoTokenLower} `);
    });
  });
};

export const CUTOFF_URL = 'https://github.com/hnmr293/sd-webui-cutoff';