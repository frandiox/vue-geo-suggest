// rollup.config.js
import buble from 'rollup-plugin-buble'
import { terser } from 'rollup-plugin-terser'

const baseConfig = {
  input: 'src/index.js',
  plugins: [buble({ objectAssign: true })],
}

const mangle = {
  properties: {
    regex: /^\$_/,
  },
}

// UMD/IIFE shared settings: externals and output.globals
// Refer to https://rollupjs.org/guide/en#output-globals for details
const external = [
  // list external dependencies, exactly the way it is written in the import statement.
  // eg. 'jquery'
]
const globals = {
  // Provide global variable names to replace your external imports
  // eg. jquery: '$'
}

// Customize configs for individual targets
const buildFormats = [
  {
    // ESM
    ...baseConfig,
    output: {
      file: 'dist/vue-geo-suggest.esm.js',
      format: 'esm',
      exports: 'named',
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        mangle,
        output: {
          ecma: 6,
        },
      }),
    ],
  },
  {
    // UMD
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/vue-geo-suggest.umd.js',
      format: 'umd',
      name: 'GeoSuggest',
      exports: 'named',
      globals,
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        mangle,
        output: {
          ecma: 6,
        },
      }),
    ],
  },
  {
    // UNPKG
    ...baseConfig,
    external,
    output: {
      compact: true,
      file: 'dist/vue-geo-suggest.min.js',
      format: 'iife',
      name: 'GeoSuggest',
      exports: 'named',
      globals,
    },
    plugins: [
      ...baseConfig.plugins,
      terser({
        mangle,
        output: {
          ecma: 5,
        },
      }),
    ],
  },
]

// Export config
export default buildFormats
