import "react";

// Allow CSS custom properties (e.g. style={{ "--hue": 60 }}) in inline
// styles. The stylesheet leans on --hue, --density and friends heavily.
declare module "react" {
  interface CSSProperties {
    [index: `--${string}`]: string | number | undefined;
  }
}
