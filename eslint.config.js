import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import perfectionist from 'eslint-plugin-perfectionist';
import perfectionistRecommendedNatural from 'eslint-plugin-perfectionist/configs/recommended-natural';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const jestAll = jest.configs['all'].rules;

delete jestAll['jest/unbound-method'];
delete jestAll['jest/no-conditional-in-test'];
delete jestAll['jest/prefer-importing-jest-globals'];

const config = [
  {
    ignores: ['coverage/**', 'test/**', 'build/**', 'dist/**', '.yarn/**']
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  perfectionistRecommendedNatural,
  sonarjs.configs.recommended,
  prettier,
  {
    linterOptions: {
      // noInlineConfig: true,
      reportUnusedDisableDirectives: 'warn'
    },
    plugins: { jest, perfectionist },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_', ignoreRestSiblings: true }
      ],
      'no-console': 'warn',
      'sonarjs/cognitive-complexity': 'warn'
    }
  },
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['src/**/*.test.ts'],
    plugins: { jest },
    rules: {
      ...jestAll,
      'jest/no-conditional-in-test': 'off',
      'jest/prefer-importing-jest-globals': 'off',
      'sonarjs/no-duplicate-string': 'off'
    }
  }
];

export default config;
