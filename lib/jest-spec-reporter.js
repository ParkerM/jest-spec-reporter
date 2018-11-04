const moment = require('moment');
const chalk = require('chalk').default;

const passedFmt = chalk.green;
const failedFmt = chalk.red;
const pendingFmt = chalk.cyan;
const titleFmt = chalk.white;
const headFmt = chalk.white;
const durationFmt = chalk.gray;
const infoFmt = chalk.white;

class JestSpecReporter {
  constructor(globalConfig, options, logFn = console.log) {
    this._globalConfig = globalConfig;
    this._options = this._validateOpts(options);
    this._logFn = logFn;
  }

  onRunStart({ numTotalTestSuites }) {
    this._logFn();
    this._logFn(infoFmt(`Found ${numTotalTestSuites} test suites`));
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
        this._logFn(failureMessage);
      }
    });
    this._logFn(infoFmt(`Ran ${numTotalTests} tests in ${testDuration()}`));
    if (numPassedTests) {
      this._logFn(
        this._getStatus('passed') + passedFmt(` ${numPassedTests} passing`)
      );
    }
    if (numFailedTests) {
      this._logFn(
        this._getStatus('failed') + failedFmt(` ${numFailedTests} failing`)
      );
    }
    if (numPendingTests) {
      this._logFn(
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
    for (let result of testResults) {
      // noinspection JSUnfilteredForInLoop
      const { title, duration, status, ancestorTitles } = result;
      console.log(`
      title: ${title}
      duration: ${duration}
      status: ${status}
      ancestorTitles: ${ancestorTitles}`);
    }
    testResults.forEach(result => this._logFn(this._getResult(result)));
  }

  _getResult(result) {
    const { title, duration, status, ancestorTitles } = result;
    return this._fmtResult(ancestorTitles, status, title, duration);
  }

  _fmtResult(ancestorTitles, status, title, duration) {
    let spacerGen;
    let fmtStr = '    ';

    // TODO: group nested tests
    switch (this._options.reportFormat) {
      case 'tree':
        spacerGen = JestSpecReporter._indentGenerator(6, 2);
        fmtStr +=
          `${headFmt(
            ancestorTitles
              .map(t => `${t}\n${spacerGen.next().value}`)
              .join('')
          )}`;
        fmtStr += this._getStatus(status);
        break;
      case 'inline':
      default:
        fmtStr += `${this._getStatus(status)} ${headFmt(ancestorTitles.join(' > '))} >`;
        break;
    }
    fmtStr += ` ${titleFmt(title)} ${durationFmt(`'(${duration} ms)`)}`;
    return fmtStr;
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
    const opts = {
      reportFormat: 'tree'
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

  static* _indentGenerator(offset = 0, indentLen = 2) {
    let i = 0;
    while (true) {
      const indent = ' '.repeat(i + offset);
      i = i + indentLen;
      yield indent;
    }
  }
}

module.exports = JestSpecReporter;
