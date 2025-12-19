import { defineConfig } from 'vite';

export default defineConfig({
    base: '/topstar/',
    server: {
        port: 5173,
        open: true
    },
    build: {
        outDir: 'dist'
    }
});
