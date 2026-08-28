export class ArmoryFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ArmoryFetchError";
  }
}

export class ArmoryParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArmoryParseError";
  }
}
