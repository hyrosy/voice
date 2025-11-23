// In src/vite-env.d.ts

/// <reference types="vite/client" />

// --- REPLACE THE PREVIOUS DECLARATION WITH THIS ---
declare module 'react-player/lazy' {
  import { Component } from 'react';
  // We declare it as accepting 'any' props to bypass strict config checks
  export default class ReactPlayer extends Component<any, any> {}
}