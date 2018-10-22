const JestSpecReporter = require('./jest-spec-reporter');

describe('Jest Spec reporter', () => {
  let reporter;

  describe('should implement', () => {
    beforeEach(() => {
      reporter = new JestSpecReporter();
    });

    it('onRunComplete ', () => {
      expect(reporter.onRunComplete).toBeDefined();
    });

    it('onRunStart ', () => {
      expect(reporter.onRunStart).toBeDefined();
    });

    it('onTestResult ', () => {
      expect(reporter.onTestResult).toBeDefined();
    });
  });

  describe('configuration options', () => {
    it('should set defaults', () => {
      reporter = new JestSpecReporter();

      const expectedOpts = {
        reportFormat: 'tree',
      };

      expect(reporter._validateOpts()).toEqual(expectedOpts);
    });

    describe('reportFormat', () => {
      it('should throw if format is invalid', () => {

      });
    });
  });
});