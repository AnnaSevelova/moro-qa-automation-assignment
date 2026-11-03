import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/**
 * JavaScript and typescript-eslint recommended and stylistic rules, plus eslint-plugin-playwright for the
 * tests. The code style (single quotes, semicolons, 4 spaces) is enforced with @stylistic rules.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export default tsEslint.config(
    {
        // Generated output, the tested backend (an unchanged copy of another repository) and generated API types
        ignores: ['node_modules/', 'test-output/', 'apps/', 'tests/api/generated/'],
    },
    {
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    js.configs.recommended,
    tsEslint.configs.recommended,
    tsEslint.configs.stylistic,
    {
        rules: {
            curly: ['error', 'all'],
            'dot-notation': 'error',
            'no-console': ['warn', { allow: ['warn', 'error', 'debug', 'dir'] }],
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
            '@typescript-eslint/no-import-type-side-effects': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
                ignoreRestSiblings: true,
                args: 'none',
            }],
        },
    },
    {
        plugins: { '@stylistic': stylistic },
        rules: {
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
            '@stylistic/padding-line-between-statements': ['error',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: 'import', next: '*' },
                { blankLine: 'any', prev: 'import', next: 'import' },
            ],
        },
    },
    {
        files: ['tests/**/*.ts'],
        ...playwright.configs['flat/recommended'],
        rules: {
            ...playwright.configs['flat/recommended'].rules,
            // Our own assertion helpers (expectNoHorizontalScroll, ...) count as assertions too
            'playwright/expect-expect': ['warn', {
                assertFunctionPatterns: ['^expect[A-Z]', '^filterAndValidatePositions$'],
            }],
        },
    },
);
