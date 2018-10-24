'use strict';

const JestSpecReporter = require('../../jest-spec-reporter');
const chalk = require('chalk');
const util = require('util');
const fs = require('fs');

const testCase = {
  context: { config: { rootDir: '/' } },
  duration: 99,
  path: '/foo'
};

const SEP_4 = '    ';

let testResults;
let aggregatedResults;

let stdout;

let oldIsTTY;
let oldStderr;
let oldStdout;

describe('Report format', () => {
  let reporter;
  let numTotalTestSuites;

  beforeEach(() => {
    const resultsJson = fs.readFileSync('./lib/integration-tests/formatter/testResults.json', 'utf8');
    const aggregatedResultsJson = fs.readFileSync('./lib/integration-tests/formatter/aggregatedResults.json', 'utf8');
    testResults = JSON.parse(resultsJson);
    aggregatedResults = JSON.parse(aggregatedResultsJson);

    jest.resetModules();
    jest.useFakeTimers();

    chalk.default.enabled = false;
    mockIo();
  });

  afterEach(() => {
    restoreIo();
    chalk.default.enabled = true;
  });

  describe('unsupported formats', () => {
    let reporterCtor;
    let reportFormat = 'unsupported format';

    beforeEach(() => {
      reporterCtor = () => new JestSpecReporter({}, { reportFormat: reportFormat });
    });

    it('should throw TypeError', () => {
      expect(reporterCtor).toThrow(
        new TypeError(`reportFormat '${reportFormat}' is invalid. Must be one of ['inline', 'tree']`)
      );
    });
  });

  describe('inline format', () => {
    beforeEach(() => {
      reporter = new JestSpecReporter({}, { reportFormat: 'inline' });
      numTotalTestSuites = 4;
    });

    it('should print full spec paths per line', () => {
      reporter.onRunStart({ numTotalTestSuites });
      const runStartLogs = tidyLog(stdout.mock.calls);
      stdout.mockClear();

      reporter.onTestResult(testCase, { testResults });
      const testResultLogs = tidyLog(stdout.mock.calls);
      stdout.mockClear();

      reporter.onRunComplete(testCase, aggregatedResults);
      const runCompleteLogs = tidyLog(stdout.mock.calls);
      stdout.mockClear();

      jest.runAllTimers();
      restoreIo();

      expect(runStartLogs[0]).toEqual(`Found ${numTotalTestSuites} test suites\n\n`);

      expect(testResultLogs[0]).toMatch(new RegExp(`^${SEP_4}✔ .*Boolean comparison > should compare two boolean values.*100 ms.*\n\n`));
      expect(testResultLogs[1]).toMatch(new RegExp(`^${SEP_4}✘ .*Boolean comparison > should make bats fly out of ones nose.*501 ms.*\n\n`));
      expect(testResultLogs[2]).toMatch(new RegExp(`^${SEP_4}✔ .*Boolean comparison > in a perfect world > should pass if true is equal to true.*201 ms.*\n\n`));
      expect(testResultLogs[3]).toMatch(new RegExp(`^${SEP_4}✘ .*Boolean comparison > in a perfect world > should fail if true is equal to false.*502 ms.*\n\n`));

      expect(runCompleteLogs[0]).toMatch(`${SEP_4}Expected bats`);
      expect(runCompleteLogs[0]).toMatch(`${SEP_4}Received: true`);

      expect(runCompleteLogs[1]).toMatch(`Ran ${numTotalTestSuites} tests in`);
      expect(runCompleteLogs[2]).toEqual(`✔ 2 passing\n\n`);
      expect(runCompleteLogs[3]).toEqual(`✘ 2 failing\n\n`);
    });
  });

  // Borrowed from jests builtin reporter int tests
  function mockIo() {
    // This is not a CI environment, which removes all output by default.
    jest.unmock('jest-util');
    const util = require('jest-util');
    util.isInteractive = true;

    oldIsTTY = process.stdin.isTTY;
    oldStdout = process.stdout.write;
    oldStderr = process.stderr.write;

    // We mock stderr (even if we do not use it right now on the tests) to avoid
    // fake reporters created while testing to mess with the real output of the
    // tests itself.
    process.stdin.isTTY = true;
    process.stderr.write = jest.fn();
    stdout = process.stdout.write = jest.fn();
  }

  function restoreIo() {
    process.stdin.isTTY = oldIsTTY;
    process.stderr.write = oldStderr;
    process.stdout.write = oldStdout;
  }

  function tidyLog(strArr) {
    return strArr
      // get rid of Function.toString junk
      .map(call => Object.values(call).filter(util.isString))
      // flatten
      .reduce((acc, val) => acc.concat(val), [])
      // split log line # noise, denoted by newline and 4 space chars
      .map(s => s.substr(s.indexOf('\n') + 1 + SEP_4))
      // remove global spacing for easier assertions
      .map(s => s.slice(4))
      // dispose of whitespace-only lines
      .filter(s => s.trim().length);
  }
});
