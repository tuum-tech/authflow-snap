import { SnapUtils } from './SnapUtils';

describe('SnapUtils', () => {
  describe('stripNewlines', () => {
    it('should remove all newline characters from a string', () => {
      const input = 'Hello\nWorld\r\n!';
      const expectedOutput = 'HelloWorld!';
      expect(SnapUtils.stripNewlines(input)).toBe(expectedOutput);
    });

    it('should return the same string if there are no newline characters', () => {
      const input = 'HelloWorld!';
      const expectedOutput = 'HelloWorld!';
      expect(SnapUtils.stripNewlines(input)).toBe(expectedOutput);
    });

    it('should return an empty string if the input is only newline characters', () => {
      const input = '\n\r\n';
      const expectedOutput = '';
      expect(SnapUtils.stripNewlines(input)).toBe(expectedOutput);
    });

    it('should handle strings with mixed content and newlines', () => {
      const input = 'Line 1\nLine 2\r\nLine 3';
      const expectedOutput = 'Line 1Line 2Line 3';
      expect(SnapUtils.stripNewlines(input)).toBe(expectedOutput);
    });

    it('should handle an empty string', () => {
      const input = '';
      const expectedOutput = '';
      expect(SnapUtils.stripNewlines(input)).toBe(expectedOutput);
    });
  });
});
