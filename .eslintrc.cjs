module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:perfectionist/recommended-natural',
    'plugin:sonarjs/recommended',
    'prettier'
  ],
  overrides: [
    {
      env: { node: true },
      files: ['*.cjs']
    }
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'perfectionist', 'only-warn'],
  reportUnusedDisableDirectives: true,
  root: true,
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true }
    ],
    'no-console': 'warn',
    'sonarjs/cognitive-complexity': 'off'
  }
};
