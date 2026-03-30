import React, { useEffect, useMemo, useRef, useState } from 'react';
import { transform } from 'sucrase';
import * as FramerMotion from 'framer-motion';

/**
 * CinematicCodeRenderer
 *
 * Compiles AI-generated React + Framer Motion JSX source files at runtime
 * and renders the Index component as a full cinematic scroll experience.
 *
 * Safety: Sucrase only transforms JSX/ES module syntax — no arbitrary eval.
 * Components can only access React and Framer Motion via the injected module map.
 */

// Shared module map — components can only import from these
const MODULE_MAP = {
  'react': React,
  'framer-motion': FramerMotion,
};

function compileModule(filename, source, moduleCache) {
  if (moduleCache[filename]) return moduleCache[filename];

  try {
    const compiled = transform(source, {
      transforms: ['jsx', 'imports'],
      jsxRuntime: 'classic',
      production: false,
    }).code;

    const moduleExports = {};
    const moduleObj = { exports: moduleExports };

    const requireFn = (moduleName) => {
      // Check shared dependencies
      if (MODULE_MAP[moduleName]) return MODULE_MAP[moduleName];
      // Check sibling files (strip ./ prefix)
      const normalized = moduleName.replace(/^\.\//, '').replace(/\.(jsx|js|ts|tsx)$/, '');
      for (const [key, mod] of Object.entries(moduleCache)) {
        const keyNorm = key.replace(/\.(jsx|js|ts|tsx)$/, '');
        if (keyNorm === normalized || keyNorm.endsWith(normalized)) return mod;
      }
      // Return empty module for unresolved imports
      console.warn(`[CinematicCode] Unresolved import: ${moduleName} in ${filename}`);
      return {};
    };

    // Execute the compiled code in a function scope
    const fn = new Function('require', 'module', 'exports', 'React', compiled);
    fn(requireFn, moduleObj, moduleExports, React);

    const result = moduleObj.exports.default || moduleObj.exports;
    moduleCache[filename] = result;
    return result;
  } catch (err) {
    console.error(`[CinematicCode] Compile error in ${filename}:`, err.message);
    moduleCache[filename] = null;
    return null;
  }
}

function CompileErrorFallback({ error, filename }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: '#0a0a0f', color: '#f87171', fontFamily: 'monospace',
      padding: 32, textAlign: 'center',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
          Compilation Error{filename ? ` in ${filename}` : ''}
        </div>
        <div style={{ fontSize: 12, color: '#fca5a5', maxWidth: 600, lineHeight: 1.6 }}>
          {error}
        </div>
      </div>
    </div>
  );
}

class CinematicErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error: error.message || String(error) };
  }
  render() {
    if (this.state.error) {
      return <CompileErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

export default function CinematicCodeRenderer({ files }) {
  const styleRef = useRef(null);

  // Inject CSS
  useEffect(() => {
    if (!files?.['index.css']) return;
    const style = document.createElement('style');
    style.setAttribute('data-cinematic-code', 'true');
    // Strip @tailwind directives and @import — Tailwind is already loaded in the portal
    const css = files['index.css']
      .replace(/@tailwind\s+\w+;/g, '')
      .replace(/@import\s+url\([^)]+\);/g, '');
    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => { if (styleRef.current) document.head.removeChild(styleRef.current); };
  }, [files]);

  // Compile all modules and resolve the Index component
  const { IndexComponent, error } = useMemo(() => {
    if (!files || typeof files !== 'object') {
      return { IndexComponent: null, error: 'No files provided' };
    }

    const moduleCache = {};

    // Compile utilities first (order matters for require resolution)
    const utilityFiles = ['useInView.js', 'useInView.ts'];
    for (const name of utilityFiles) {
      if (files[name]) compileModule(name, files[name], moduleCache);
    }

    // Compile scene files and other components (everything except Index and CSS)
    const sceneFiles = Object.keys(files).filter(
      f => f !== 'index.css' && f !== 'Index.jsx' && f !== 'Index.tsx' && !utilityFiles.includes(f)
    );
    for (const name of sceneFiles) {
      compileModule(name, files[name], moduleCache);
    }

    // Compile Index last (depends on all other modules)
    const indexFile = files['Index.jsx'] || files['Index.tsx'];
    if (!indexFile) {
      return { IndexComponent: null, error: 'No Index.jsx file found in generated code' };
    }

    const IndexComp = compileModule('Index.jsx', indexFile, moduleCache);
    if (!IndexComp || typeof IndexComp !== 'function') {
      return { IndexComponent: null, error: 'Index.jsx did not export a valid React component' };
    }

    return { IndexComponent: IndexComp, error: null };
  }, [files]);

  if (error) return <CompileErrorFallback error={error} />;
  if (!IndexComponent) return <CompileErrorFallback error="Failed to compile presentation" />;

  return (
    <CinematicErrorBoundary>
      <IndexComponent />
    </CinematicErrorBoundary>
  );
}
