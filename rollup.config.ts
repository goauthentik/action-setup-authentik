// See: https://rollupjs.org/introduction/

import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: ["src/index.ts", "src/post.ts"],
  output: {
    esModule: true,
    dir: "dist/",
    format: "es",
    sourcemap: true,
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()],
};

export default config;
