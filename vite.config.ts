import { resolve, dirname } from 'path';
import { defineConfig } from 'vite';
import nodeResolve from '@rollup/plugin-node-resolve';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nodeModules = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
].flat();

function copyAssetsPlugin() {
    return {
        name: 'copy-assets',
        writeBundle() {
            try {
                const distDir = resolve(__dirname, 'dist');
                const pkg = JSON.parse(fs.readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
                const minPkg = {
                    name: pkg.name,
                    plugin: pkg.plugin,
                    version: pkg.version,
                    type: pkg.type,
                    main: pkg.main,
                    description: pkg.description,
                    author: pkg.author,
                    license: pkg.license,
                    napcat: pkg.napcat,
                };
                fs.writeFileSync(resolve(distDir, 'package.json'), JSON.stringify(minPkg, null, 2));
            } catch (e) {
                console.error('复制资源失败:', e);
            }
        },
    };
}

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.mjs',
        },
        outDir: 'dist',
        emptyOutDir: true,
        minify: false,
        rollupOptions: {
            external: [...nodeModules, 'napcat-types', 'napcat-types/napcat-onebot/network/plugin/types', 'napcat-types/napcat-onebot/event/index', 'napcat-types/napcat-onebot/event/message'],
        },
    },
    plugins: [nodeResolve(), copyAssetsPlugin()],
});
