export const CAD_VIEWABLE_EXTENSIONS = ['step', 'stp', 'iges', 'igs', 'brep', 'stl', 'obj', 'glb', 'gltf'];

export function isCadViewable(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return !!ext && CAD_VIEWABLE_EXTENSIONS.includes(ext);
}
