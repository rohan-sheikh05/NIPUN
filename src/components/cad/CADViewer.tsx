import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { formatFromExtension, parseCadFile } from '../../lib/occtWorker';
import { occtResultToGroup } from '../../lib/cadGeometry';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

/** Centers the object at the origin and returns its bounding sphere radius. */
function centerAndMeasure(object: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  object.position.sub(center);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  return sphere.radius || 1;
}

async function loadObject(fileUrl: string, fileName: string): Promise<THREE.Object3D> {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error('Could not download the file for preview.');

  if (ext === 'glb' || ext === 'gltf') {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const buffer = await response.arrayBuffer();
    const loader = new GLTFLoader();
    const gltf = await new Promise<any>((resolve, reject) => loader.parse(buffer, '', resolve, reject));
    return gltf.scene;
  }

  if (ext === 'stl') {
    const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
    const buffer = await response.arrayBuffer();
    const geometry = new STLLoader().parse(buffer);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({ color: 0xc7d3e0, roughness: 0.6, metalness: 0.1 });
    return new THREE.Mesh(geometry, material);
  }

  if (ext === 'obj') {
    const { OBJLoader } = await import('three/addons/loaders/OBJLoader.js');
    const text = await response.text();
    return new OBJLoader().parse(text);
  }

  const format = formatFromExtension(fileName);
  if (format) {
    const buffer = await response.arrayBuffer();
    const result = await parseCadFile(format, buffer);
    return occtResultToGroup(result);
  }

  throw new Error(`Unsupported format: .${ext}`);
}

export function CADViewer({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let animationId: number;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: import('three/addons/controls/OrbitControls.js').OrbitControls | undefined;
    let resizeObserver: ResizeObserver | undefined;
    const disposables: { dispose: () => void }[] = [];

    async function init() {
      const container = containerRef.current;
      if (!container) return;
      setState('loading');
      setError(null);

      try {
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
        const object = await loadObject(fileUrl, fileName);
        if (disposed || !containerRef.current) return;

        const width = container.clientWidth;
        const height = container.clientHeight || 360;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x101c2c); // matches --color-blueprint-900

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100000);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(5, 8, 6);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
        fill.position.set(-6, -3, -4);
        scene.add(fill);

        const radius = centerAndMeasure(object);
        scene.add(object);

        // Frame the camera so the whole model is visible regardless of its
        // native scale/units (STEP files can be in mm, m, or inches).
        const distance = radius * 2.6;
        camera.position.set(distance, distance * 0.8, distance);
        camera.near = radius / 100;
        camera.far = radius * 100;
        camera.updateProjectionMatrix();

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.target.set(0, 0, 0);

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          controls?.update();
          renderer?.render(scene, camera);
        };
        animate();

        resizeObserver = new ResizeObserver(() => {
          if (!containerRef.current || !renderer) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight || 360;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
        resizeObserver.observe(container);

        disposables.push({
          dispose: () => {
            object.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((m) => m?.dispose());
              }
            });
          },
        });

        setState('ready');
      } catch (err) {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'Could not load this file for preview.');
          setState('error');
        }
      }
    }

    init();

    return () => {
      disposed = true;
      if (animationId) cancelAnimationFrame(animationId);
      resizeObserver?.disconnect();
      controls?.dispose();
      renderer?.dispose();
      disposables.forEach((d) => d.dispose());
    };
  }, [fileUrl, fileName]);

  return (
    <div className="relative rounded-sm overflow-hidden border border-blueprint-700 bg-blueprint-900">
      <div ref={containerRef} className="w-full h-[360px]" />
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-blueprint-900/80">
          <p className="font-mono text-xs text-line-500 uppercase tracking-[0.14em]">Loading model…</p>
        </div>
      )}
      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-blueprint-900/90 px-6 text-center">
          <p className="font-mono text-xs text-danger-500">{error}</p>
        </div>
      )}
    </div>
  );
}
