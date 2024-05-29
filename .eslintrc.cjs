module.exports = {
  extends: ['eslint:recommended', 'plugin:perfectionist/recommended-natural', 'plugin:sonarjs/recommended', 'prettier'],
  overrides: [
    {
      env: { node: true },
      files: ['*.cjs']
    },
    {
      extends: ['plugin:@typescript-eslint/recommended'],
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json'
      },
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'warn',
          { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true }
        ]
      }
    },
    {
      extends: ['plugin:jest/all'],
      files: ['*.test.ts'],
      plugins: ['jest'],
      rules: {
        'jest/no-conditional-in-test': 'off',
        //'jest/no-hooks': 'off',
        'jest/prefer-importing-jest-globals': 'off',
        'sonarjs/no-duplicate-string': 'off'
      }
    }
  ],
  plugins: ['perfectionist', 'only-warn'],
  reportUnusedDisableDirectives: true,
  root: true,
  rules: {
    'no-console': 'warn'
  }
};
