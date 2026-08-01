"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const nodeColors = [0x2478ee, 0x5da6f4, 0x9bc8f7, 0xf28b31];

export default function AdminNetworkScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7.4);
    camera.lookAt(0, 0, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "admin-network-canvas";
    mount.appendChild(renderer.domElement);

    const network = new THREE.Group();
    network.position.set(0.62, 0.04, 0);
    network.scale.setScalar(window.innerWidth < 720 ? 0.64 : 0.78);
    scene.add(network);

    const compact = window.innerWidth < 720;
    const nodeCount = compact ? 5 : 7;
    const positions: THREE.Vector3[] = [];
    for (let index = 0; index < nodeCount; index += 1) {
      const angle = index * 2.39996;
      const depth = ((index * 17) % 11) / 10 - 0.5;
      const radius = 1.1 + ((index * 11) % 9) / 9 * 1.05;
      positions.push(new THREE.Vector3(
        Math.cos(angle) * radius * 0.92,
        Math.sin(angle) * radius * 0.68,
        depth * 1.55,
      ));
    }

    const nodeGeometry = new THREE.IcosahedronGeometry(0.065, 1);
    const nodeMaterials = nodeColors.map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    positions.forEach((position, index) => {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterials[index % nodeMaterials.length]);
      node.position.copy(position);
      network.add(node);
    });

    const coreGeometry = new THREE.OctahedronGeometry(1.02, 1);
    const core = new THREE.LineSegments(new THREE.EdgesGeometry(coreGeometry), new THREE.LineBasicMaterial({ color: 0x2478ee, transparent: true, opacity: 0.25 }));
    coreGeometry.dispose();
    network.add(core);

    const ringColors = [0x6fa6e5];
    const ringRotations: Array<[number, number, number]> = [[0.55, 0.22, 0.1]];
    ringRotations.forEach(([x, y, z], index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.009, 6, 96),
        new THREE.MeshBasicMaterial({ color: ringColors[index], transparent: true, opacity: 0.25 }),
      );
      ring.rotation.set(x, y, z);
      network.add(ring);
    });

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const width = Math.max(bounds.width, 1);
      const height = Math.max(bounds.height, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let drift = 0;
    const renderFrame = () => {
      network.rotation.y = drift;
      network.rotation.x = Math.sin(drift * 0.55) * 0.08;
      renderer.render(scene, camera);
    };
    const animate = () => {
      drift += 0.0024;
      renderFrame();
      animationFrame = window.requestAnimationFrame(animate);
    };
    const onMotionPreferenceChange = () => {
      if (reducedMotion.matches) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
        renderFrame();
      } else if (!animationFrame) {
        animate();
      }
    };

    if (reducedMotion.matches) renderFrame();
    else animate();
    reducedMotion.addEventListener("change", onMotionPreferenceChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      reducedMotion.removeEventListener("change", onMotionPreferenceChange);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const material = object.material;
          if (Array.isArray(material)) material.forEach((item) => item.dispose());
          else material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={mountRef} className="admin-network-scene" aria-hidden="true" />;
}
