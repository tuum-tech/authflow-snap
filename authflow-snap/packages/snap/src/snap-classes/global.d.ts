declare namespace NodeJS {
  interface Global {
    snap: {
      request: jest.Mock;
    };
    ethereum: {
      request: jest.Mock;
    };
  }
}

declare const snap: {
  request: jest.Mock;
};

declare const ethereum: {
  request: jest.Mock;
};
