declare global {
  interface String {
    firstName: () => string;
    firstLetter: () => string;
  }
}

export {};
