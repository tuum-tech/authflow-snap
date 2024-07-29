export class SnapUtils {
  public static stripNewlines(input: string): string {
    return input.replace(/[\r\n]+/g, '');
  }
}
