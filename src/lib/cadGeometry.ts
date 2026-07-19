import * as THREE from 'three';
import type { OcctResult } from './occtWorker';

const DEFAULT_MATERIAL = new THREE.MeshStandardMaterial({ color: 0xc7d3e0, roughness: 0.6, metalness: 0.1 });

export function occtResultToGroup(result: OcctResult): THREE.Group {
  const group = new THREE.Group();

  for (const mesh of result.meshes) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(mesh.attributes.position.array, 3));
    if (mesh.attributes.normal) {
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(mesh.attributes.normal.array, 3));
    } else {
      geometry.computeVertexNormals();
    }
    geometry.setIndex(Array.from(mesh.index.array));

    const material = mesh.color
      ? new THREE.MeshStandardMaterial({
          color: new THREE.Color(mesh.color[0], mesh.color[1], mesh.color[2]),
          roughness: 0.6,
          metalness: 0.1,
        })
      : DEFAULT_MATERIAL;

    const threeMesh = new THREE.Mesh(geometry, material);
    threeMesh.name = mesh.name;
    group.add(threeMesh);
  }

  return group;
}
