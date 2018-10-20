import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
import visualizer from 'rollup-plugin-visualizer';
import { terser } from "rollup-plugin-terser";
import { version } from "./package.json";

export default {
  input: 'src/lib.js',
  output: {
    sourcemap: true,
    name: "ReactMSAViewer",
    file: "dist/index.umd.js",
    format: "umd",
    exports: "named", // or: 'default', 'named', 'none'
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      'prop-types': 'PropTypes',
    }
  },
  external: [
    'react',
    'react-dom',
    'prop-types',
  ],
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: ['@babel/preset-react', '@babel/preset-env'],
      plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-proposal-class-properties',
        "lodash",
      ],
      //externalHelpers: false,
    }),
    resolve({
      browser: true,
    }),
    commonjs({
      namedExports: {
        'color-convert': ['rgb', 'hsl', 'hsv', 'hwb', 'cmyk', 'xyz', 'lab', 'lch', 'hex', 'ansi16', 'ansi256', 'hcg', 'apple', 'gray', 'keyword'],
      },
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'MSA_DEVELOPMENT_VERSION': version,
    }),
    terser(),
    visualizer({
      filename: './dist/statistics.html',
      title: 'MSAViewer Bundle',
      //sourcemap: true,
    }),
  ],
};