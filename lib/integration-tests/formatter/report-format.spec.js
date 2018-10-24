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
      reporter.onTestResult(testCase, { testResults });
      reporter.onRunComplete(testCase, aggregatedResults);

      jest.runAllTimers();

      expect(stdout).toHaveBeenCalled();
      restoreIo();

      const grossStrs = stdout.mock.calls
        .map(call => Object.values(call).filter(util.isString))
        .reduce((acc, val) => acc.concat(val), []);
      const tidyLogs = tidyLog(grossStrs);

      expect(tidyLogs[0]).toEqual(`Found ${numTotalTestSuites} test suites\n\n`);

      expect(tidyLogs[1]).toEqual(`${SEP_4}✔ Boolean comparison > should compare two boolean values '(100 ms)\n\n`);
      expect(tidyLogs[2]).toEqual(`${SEP_4}✘ Boolean comparison > should make bats fly out of ones nose '(501 ms)\n\n`);
      expect(tidyLogs[3]).toEqual(`${SEP_4}✔ Boolean comparison > in a perfect world > should pass if true is equal to true '(201 ms)\n\n`);
      expect(tidyLogs[4]).toEqual(`${SEP_4}✘ Boolean comparison > in a perfect world > should fail if true is equal to false '(502 ms)\n\n`);

      expect(tidyLogs[5]).toMatch(`${SEP_4}Expected bats`);
      expect(tidyLogs[5]).toMatch(`${SEP_4}Received: true`);

      expect(tidyLogs[6]).toMatch(`Ran ${numTotalTestSuites} tests in`);
      expect(tidyLogs[7]).toEqual(`✔ 2 passing\n\n`);
      expect(tidyLogs[8]).toEqual(`✘ 2 failing\n\n`);
    });

    function tidyLog(strArr) {
      const sepdStrs = strArr.map(s => s.substr(s.indexOf('\n') + 1 + SEP_4))
        .map(s => s.slice(4));
      let neatStrs = [];
      while (sepdStrs.length) {
        let s = sepdStrs.pop();
        neatStrs.push(s);
        if (s.indexOf(`Found ${numTotalTestSuites}`) >= 0) break;
      }
      return neatStrs.reverse();
    }
  });

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
});
