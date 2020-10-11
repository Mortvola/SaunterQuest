module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb',
    'plugin:react/recommended',
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
  settings: {
    'import/resolver': {
      typescript: {}
    }
  },
  overrides: [{
    files: ["**/*.ts", "**/*.tsx"],
    extends: [
      'airbnb',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 2018,
      sourceType: 'module',
      project: './tsconfig.json',
    },
    plugins: [
      'react',
      '@typescript-eslint',
      'import',
    ]
  }]
};
