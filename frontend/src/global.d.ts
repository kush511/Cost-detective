declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'react/jsx-runtime' {
  export {};
}

declare module 'react/jsx-dev-runtime' {
  export {};
}