const moment = require('moment');
const chalk = require('chalk');

const passedFmt = chalk.green;
const failedFmt = chalk.red;
const pendingFmt = chalk.cyan;
const titleFmt = chalk.white;
const headFmt = chalk.white;
const durationFmt = chalk.gray;
const infoFmt = chalk.white;

class JestSpecReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = this._validateOpts(options);
  }

  onRunStart({ numTotalTestSuites }) {
    console.log();
    console.log(infoFmt(`Found ${numTotalTestSuites} test suites`));
  }

  onRunComplete(test, results) {
    const {
      numFailedTests,
      numPassedTests,
      numPendingTests,
      testResults,
      numTotalTests,
      startTime
    } = results;

    testResults.map(({ failureMessage }) => {
      if (failureMessage) {
        console.log(failureMessage);
      }
    });
    console.log(infoFmt(`Ran ${numTotalTests} tests in ${testDuration()}`));
    if (numPassedTests) {
      console.log(
        this._getStatus('passed') + passedFmt(` ${numPassedTests} passing`)
      );
    }
    if (numFailedTests) {
      console.log(
        this._getStatus('failed') + failedFmt(` ${numFailedTests} failing`)
      );
    }
    if (numPendingTests) {
      console.log(
        this._getStatus('pending') + pendingFmt(` ${numPendingTests} pending`)
      );
    }

    function testDuration() {
      const delta = moment.duration(moment() - new Date(startTime));
      const seconds = delta.seconds();
      const millis = delta.milliseconds();
      return `${seconds}.${millis} s`;
    }
  }

  onTestResult(test, { testResults }) {
    testResults.map(result => {
      const { title, duration, status, ancestorTitles } = result;
      const head = `${ancestorTitles.join(' > ')} >`;
      console.log(
        `    ${this._getStatus(status)} ${headFmt(head)} ${titleFmt(
          title
        )} ${durationFmt(`'(${duration} ms)`)}`
      );
    });
  }

  _getStatus(status) {
    switch (status) {
      case 'passed':
        return passedFmt('✔');
      default:
      case 'failed':
        return failedFmt('✘');
      case 'pending':
        return pendingFmt('-');
    }
  }

  _validateOpts(options) {
    console.log('hi');
    console.log(options);
    const opts = {
      reportFormat: 'tree',
    };
    if (!options) return opts;

    const reportFormat = options.reportFormat;
    if (reportFormat) {
      const validReportFormats = ['inline', 'tree'];
      if (!validReportFormats.some(f => f === reportFormat)) {
        throw TypeError(`reportFormat '${reportFormat}' is invalid. Must be one of [${validReportFormats.map(f => `'${f}'`).join(', ')}]`);
      }
      opts.reportFormat = reportFormat;
    }

    return opts;
  }
}

module.exports = JestSpecReporter;
