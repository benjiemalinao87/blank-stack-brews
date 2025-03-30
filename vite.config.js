
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "localhost",
      port: 8081,
      watch: {
        usePolling: true,
        interval: 1000,
      },
      cors: true,
      proxy: {
        '/api': {
          target: 'https://ycwttshvizkotcwwyjpt.supabase.co',
          changeOrigin: true,
          secure: false,
        }
      },
      // Add history fallback for client-side routing
      historyApiFallback: true,
    },
    // Define env variables
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    },
    plugins: [
      react({
        include: '**/*.{jsx,js,tsx,ts}',
        // Enable Fast Refresh for all components
        fastRefresh: true,
        // Configure JSX for .js files
        jsxRuntime: 'automatic',
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@contexts": path.resolve(__dirname, "./src/contexts"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@lib": path.resolve(__dirname, "./src/lib"),
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
    },
    // Enhanced esbuild configuration for JSX in .js files
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.(jsx?|tsx?)$/,
      exclude: [],
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@chakra-ui/react',
        'lucide-react',
        '@supabase/supabase-js',
        'socket.io-client',
        'zustand',
        'framer-motion',
      ],
      exclude: [],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@chakra-ui/react', '@emotion/react', '@emotion/styled'],
            supabase: ['@supabase/supabase-js'],
            socket: ['socket.io-client'],
            state: ['zustand'],
            animation: ['framer-motion'],
          }
        }
      }
    },
  };
});
