import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
        globals: true,
        environment: 'jsdom',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json'],
            
            thresholds: {
                global: {
                    statements: 80,  
                    branches: 70,    
                    functions: 80,   
                    lines: 80,      
                },
                perFile: true, 
            },
        },
    },
});