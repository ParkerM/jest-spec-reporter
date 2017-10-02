# Simple Spec reporter for jest

## Installation

You may install this package as a development dependency:

```bash
npm install jest-spec-reporter --save-dev
```

⚠ Tested with Node 8.4 and Jest 21.2.1

## Configuration

Configure [Jest](https://facebook.github.io/jest/docs/en/configuration.html) to use the reporter.

For example, create a `jest.config.js` file containing:

```javascript
module.exports = {
  verbose: false,
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  reporters: [
    'jest-spec-reporter'
  ]
};
```

You can checkout the expected output by running `npm run example`.
