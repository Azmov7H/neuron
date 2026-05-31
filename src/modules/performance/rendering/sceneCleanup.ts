import * as THREE from 'three';

/**
 * Utility class to clean up a Three.js scene and dispose of all resources.
 * Prevents memory leaks by disposing geometries, materials, textures, and
 * other disposable objects when the scene is no longer needed.
 */
export class SceneCleanup {
  private readonly scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Recursively traverse the scene and dispose of all disposable resources.
   */
  dispose(): void {
    this.scene.traverse((object) => {
      // Dispose geometry
      if ((object as THREE.Mesh).geometry) {
        (object as THREE.Mesh).geometry.dispose();
      }

      // Dispose material(s)
      const material = (object as THREE.Mesh).material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else if (material) {
        material.dispose();
      }

      // Dispose textures attached to material (e.g., map, envMap)
      if (material && (material as any).map) {
        (material as any).map.dispose();
      }
      if (material && (material as any).envMap) {
        (material as any).envMap.dispose();
      }
    });
  }
}
