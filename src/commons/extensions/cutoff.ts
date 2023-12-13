import { Config } from '../config';

export interface ICutOff {
  tokens: string[];
  weight?: number;
}

export const getCutOffTokens = (prompt: string): string[] => {
  let tokens = prompt.split(/,|BREAK|SEP|SKIP/i);
  tokens = tokens.map((token) => token.trim());

  const autoTokens = Config.get('cutoffTokens');

  return tokens.filter((token) => {
    return autoTokens.some((autoToken) => {
      const tokenLower = token.toLowerCase();
      const autoTokenLower = autoToken.toLowerCase();
      return tokenLower.startsWith(autoTokenLower) || tokenLower.endsWith(autoTokenLower) || tokenLower.includes(` ${autoTokenLower} `);
    });
  });
};
