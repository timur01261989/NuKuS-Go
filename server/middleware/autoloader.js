import { readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import { pathToFileURL } from 'url';

/**
 * Automatically loads all route files from a directory
 * Uber/Yandex level production pattern
 */
export async function loadRoutes(router, dirPath) {
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      const fullPath = join(dirPath, file);
      const fileStat = await stat(fullPath);
      
      if (fileStat.isDirectory()) {
        // Recursively load subdirectories
        await loadRoutes(router, fullPath);
      } else if (file.endsWith('.js') && !file.startsWith('_')) {
        // Load route file
        const module = await import(pathToFileURL(fullPath).href);
        
        if (module.default && typeof module.default === 'function') {
          const routeName = basename(file, '.js');
          const routePath = fullPath
            .replace(dirPath, '')
            .replace(/\\/g, '/')
            .replace('.js', '')
            .toLowerCase();
          
          console.log(`📁 Loading route: ${routePath}`);
          
          // Mount the route
          if (module.default.router) {
            router.use(routePath, module.default.router);
          } else {
            router.use(routePath, module.default);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading routes:', error);
    throw error;
  }
}

/**
 * Load middleware from a directory
 */
export async function loadMiddleware(dirPath) {
  const middleware = {};
  
  try {
    const files = await readdir(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const fullPath = join(dirPath, file);
        const module = await import(pathToFileURL(fullPath).href);
        const name = basename(file, '.js');
        middleware[name] = module.default || module;
      }
    }
    
    return middleware;
  } catch (error) {
    console.error('Error loading middleware:', error);
    return {};
  }
}
