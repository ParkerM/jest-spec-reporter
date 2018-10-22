'use strict';

const JestSpecReporter = require('../../../jest-spec-reporter');
const util = require('util');
const fs = require('fs');

const testCase = {
  context: { config: { rootDir: '/' } },
  duration: 99,
  path: '/foo'
};

let testResults;
let aggregatedResults;

let stdout;

let oldIsTTY;
let oldStderr;
let oldStdout;

describe('Tree formatter', () => {
  beforeEach(() => {
    const resultsJson = fs.readFileSync('./lib/integration-tests/formatter/tree/testResults.json', 'utf8');
    const aggregatedResultsJson = fs.readFileSync('./lib/integration-tests/formatter/tree/aggregatedResults.json', 'utf8');
    testResults = JSON.parse(resultsJson);
    aggregatedResults = JSON.parse(aggregatedResultsJson);

    jest.resetModules();
    jest.useFakeTimers();
    mockIo();
  });

  afterEach(() => {
    restoreIo();
  });

  it('prints to stdout', () => {
    const reporter = new JestSpecReporter({}, { reportFormat: 'tree' });

    let numTotalTestSuites = 4;
    reporter.onRunStart({ numTotalTestSuites });
    reporter.onTestResult(testCase, {testResults});
    reporter.onRunComplete(testCase, aggregatedResults);

    jest.runAllTimers();

    expect(stdout).toHaveBeenCalled();
    // Object.entries(stdout.mock.calls).flat()
    restoreIo();
    // stdout.mock.calls.forEach(value => {
    //   let values = Object.values(value);
    //   values.filter(util.isString).forEach(v => console.log(v));
    // });

    const foo = stdout.mock.calls
      .map(call => Object.values(call).filter(util.isString))
      .reduce((acc, val) => acc.concat(val), []);
    // console.log(foo);

    expect(foo).toContain('✔ Boolean comparison > should compare two boolean values \'(100 ms)');
  });

  // test('when using stderr as output, no stdout call is made', () => {
  //   const reporter = new DefaultReporter({ rootDir: '', useStderr: true });
  //
  //   reporter.onRunStart(aggregatedResults, options);
  //   reporter.onTestStart(testCase);
  //   reporter.onTestResult(testCase, testResult, aggregatedResults);
  //   reporter.onRunComplete();
  //
  //   jest.runAllTimers();
  //
  //   expect(stdout).not.toHaveBeenCalled();
  // });

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
