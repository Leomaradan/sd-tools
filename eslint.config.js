import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jest from 'eslint-plugin-jest';
import 'eslint-plugin-only-warn';
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
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/max-switch-cases': 'warn',
      'sonarjs/no-all-duplicated-branches': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-collection-size-mischeck': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-duplicated-branches': 'warn',
      'sonarjs/no-element-overwrite': 'warn',
      'sonarjs/no-empty-collection': 'warn',
      'sonarjs/no-extra-arguments': 'warn',
      'sonarjs/no-gratuitous-expressions': 'warn',
      'sonarjs/no-identical-conditions': 'warn',
      'sonarjs/no-identical-expressions': 'warn',
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-ignored-return': 'warn',
      'sonarjs/no-inverted-boolean-check': 'warn',
      'sonarjs/no-nested-switch': 'warn',
      'sonarjs/no-nested-template-literals': 'warn',
      'sonarjs/no-one-iteration-loop': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-same-line-conditional': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-use-of-empty-return-value': 'warn',
      'sonarjs/no-useless-catch': 'warn',
      'sonarjs/non-existent-operator': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-object-literal': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',
      'sonarjs/prefer-while': 'warn'
    }
  },
  {
    files: ['*.cjs', '*.mjs'],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      'no-console': 'off'
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
