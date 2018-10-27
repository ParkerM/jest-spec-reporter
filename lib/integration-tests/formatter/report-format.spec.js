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

describe('Report format', () => {
  let reporter;
  let numTotalTestSuites;
  let logFn;

  beforeEach(() => {
    const resultsJson = fs.readFileSync('./lib/integration-tests/formatter/testResults.json', 'utf8');
    const aggregatedResultsJson = fs.readFileSync('./lib/integration-tests/formatter/aggregatedResults.json', 'utf8');
    testResults = JSON.parse(resultsJson);
    aggregatedResults = JSON.parse(aggregatedResultsJson);

    jest.useFakeTimers();

    logFn = jest.fn({
      apply: () => jest.fn(),
    });
    chalk.default.enabled = false;
  });

  afterEach(() => {
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
      reporter = new JestSpecReporter({}, { reportFormat: 'inline' }, logFn);
      numTotalTestSuites = 4;
    });

    it('should print full spec paths per line', () => {
      reporter.onRunStart({ numTotalTestSuites });
      const runStartLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();

      reporter.onTestResult(testCase, { testResults });
      const testResultLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();

      reporter.onRunComplete(testCase, aggregatedResults);
      const runCompleteLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();

      jest.runAllTimers();

      expect(runStartLogs[0]).toMatch(`Found ${numTotalTestSuites} test suites`);

      expect(testResultLogs[0]).toMatch(new RegExp(`^${SEP_4}✔ .*Boolean comparison > should compare two boolean values.*100 ms.*`));
      expect(testResultLogs[1]).toMatch(new RegExp(`^${SEP_4}✘ .*Boolean comparison > should make bats fly out of ones nose.*501 ms.*`));
      expect(testResultLogs[2]).toMatch(new RegExp(`^${SEP_4}✔ .*Boolean comparison > in a perfect world > should pass if true is equal to true.*201 ms.*`));
      expect(testResultLogs[3]).toMatch(new RegExp(`^${SEP_4}✘ .*Boolean comparison > in a perfect world > should fail if true is equal to false.*502 ms.*`));

      expect(runCompleteLogs[0]).toMatch(`Expected bats`);
      expect(runCompleteLogs[0]).toMatch(`Received: true`);

      expect(runCompleteLogs[1]).toMatch(`Ran ${numTotalTestSuites} tests in`);
      expect(runCompleteLogs[2]).toEqual(`✔ 2 passing`);
      expect(runCompleteLogs[3]).toEqual(`✘ 2 failing`);
    });
  });

  describe('tree format', () => {
    let runStartLogs;
    let testResultLogs;
    let runCompleteLogs;

    beforeEach(() => {
      reporter = new JestSpecReporter({}, { reportFormat: 'tree' }, logFn);
      numTotalTestSuites = 4;

      reporter.onRunStart({ numTotalTestSuites });
      runStartLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();

      reporter.onTestResult(testCase, { testResults });
      testResultLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();

      reporter.onRunComplete(testCase, aggregatedResults);
      runCompleteLogs = tidyLog(logFn.mock.calls);
      logFn.mockClear();
    });

    it('should display total tests', () => {
      expect(runStartLogs[0]).toMatch(`Found ${numTotalTestSuites} test suites`);
    });

    it('should log each describe and unit on separate lines', () => {
      expect(getIndentedLines(testResultLogs[0]).length).toBe(2);
      expect(getIndentedLines(testResultLogs[1]).length).toBe(2);

      expect(getIndentedLines(testResultLogs[2]).length).toBe(3);
      expect(getIndentedLines(testResultLogs[3]).length).toBe(3);
    });

    it('should incrementally indent hierarchy', () => {
      expect(testResultLogs[0]).toNestWithDepthOf(2);
      expect(testResultLogs[1]).toNestWithDepthOf(2);
      expect(testResultLogs[2]).toNestWithDepthOf(2);
      expect(testResultLogs[3]).toNestWithDepthOf(2);
    });

    it('should prepend result marker to unit line', () => {
      const statusRegex = /^ *[✔✘]/;
      expect(getIndentedLines(testResultLogs[0])[0]).not.toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[1])[0]).not.toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[2])[0]).not.toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[3])[0]).not.toMatch(statusRegex);

      expect(getIndentedLines(testResultLogs[0]).pop()).toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[1]).pop()).toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[2]).pop()).toMatch(statusRegex);
      expect(getIndentedLines(testResultLogs[3]).pop()).toMatch(statusRegex);
    });

    it('should display summary', () => {
      expect(runCompleteLogs[0]).toMatch(`Expected bats`);
      expect(runCompleteLogs[0]).toMatch(`Received: true`);

      expect(runCompleteLogs[1]).toMatch(`Ran ${numTotalTestSuites} tests in`);
      expect(runCompleteLogs[2]).toEqual(`✔ 2 passing`);
      expect(runCompleteLogs[3]).toEqual(`✘ 2 failing`);
    });

    function getIndentedLines(str) {
      const regex = new RegExp('(^ +).*', 'gm');
      return str.match(regex);
    }

    expect.extend({
      toNestWithDepthOf(received, indentLen) {
        const matches = getIndentedLines(received);
        const offset = matches[0].search(/[^ ]/);
        let prevIndent = offset;

        const getMessage = (line, actualIndent) => {
          return () =>
            `expected \n\n${line}\n\n to be indented by ${indentLen} in string \n\n${received} but it was indented by ${actualIndent - prevIndent}`;
        };

        for (let i = 0; i < matches.length; i++) {
          const expectedIndent = (indentLen * i) + offset;
          const line = matches[i];
          const actualIndent = line.search(/[^ ]/);
          if (actualIndent !== expectedIndent)
            return {
              message: getMessage(line, actualIndent),
              pass: false
            };
          prevIndent = actualIndent;
        }
        return {
          message: () =>
            `expected ${received} to be have indents in increments of ${indentLen}`,
          pass: true
        };
      }
    });
  });

  function tidyLog(strArr) {
    return strArr
      // get rid of Function.toString junk
      .map(call => Object.values(call).filter(util.isString))
      // flatten
      .reduce((acc, val) => acc.concat(val), []);
  }
});
