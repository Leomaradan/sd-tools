export interface ICutOff {
  tokens: string[];
  weight?: number;
}

export const cutoffAutoToken = [
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'black',
  'white',
  'grey',
  'brown',
  'cyan',
  'magenta',
  'lime',
  'maroon',
  'navy',
  'olive',
  'teal',
  'violet',
  'turquoise',
  'silver',
  'gold',
  'copper',
  'indigo',
  'azure',
  'beige',
  'lavender',
  'plum',
  'mint',
  'apricot',
  'navajo',
  'rose',
  'peach',
  'cream',
  'charcoal',
  'coral',
  'salmon',
  'mustard'
];

export const getCutOffTokens = (prompt: string): string[] => {
  let tokens = prompt.split(/,|BREAK|SEP|SKIP/i);
  tokens = tokens.map((token) => token.trim());

  return tokens.filter((token) => {
    return cutoffAutoToken.some((autoToken) => {
      const tokenLower = token.toLowerCase();
      const autoTokenLower = autoToken.toLowerCase();
      return tokenLower.startsWith(autoTokenLower) || tokenLower.endsWith(autoTokenLower) || tokenLower.includes(` ${autoTokenLower} `);
    });
  });
};
