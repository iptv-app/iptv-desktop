import { defineConfig } from 'electron-vite';
import minifyHTML from 'rollup-plugin-html-literals';
import summary from 'rollup-plugin-summary';

export default defineConfig(({ mode }) => ({
  main: {
    plugins: [],
    build: {
      externalizeDeps: true,
      bytecode: true,
      rollupOptions: {
        output: {
          format: 'es'
        }
      },
      minify: mode === 'production' ? 'terser' : false
    }
  },
  preload: {
    plugins: [],
    build: {
      externalizeDeps: true,
      bytecode: true,
      rollupOptions: {
        output: {
          format: 'es'
        }
      },
      minify: mode === 'production' ? 'terser' : false
    }
  },
  renderer: {
    plugins: mode === 'production' ? [minifyHTML(), summary()] : undefined,
    build: {
      minify: mode === 'production' ? 'terser' : false
    }
  }
}));
