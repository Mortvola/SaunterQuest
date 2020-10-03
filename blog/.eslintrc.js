module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      alias: [
        ['App', './app'],
        ['ioc', './node_modules/@adonisjs'],
      ],
    },
  },
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
    '@typescript-eslint',
  ],
  rules: {
  	"indent": ["error", 2],
	"brace-style": ["error", "stroustrup"],
	"react/jsx-indent-props": ["error", 2],
	"react/jsx-indent": ["error", 2],
	"react/jsx-props-no-spreading": ["off"],
	"jsx-a11y/click-events-have-key-events": ["off"],
	"jsx-a11y/no-static-element-interactions": ["off"],
	"no-param-reassign": ["error", { "props": false }],
	"jsx-a11y/label-has-associated-control": ["off"],
  },
};
