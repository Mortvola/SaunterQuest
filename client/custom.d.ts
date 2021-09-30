declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.glsl' {
  const classes: string;
  export default classes;
}
