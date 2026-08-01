"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import * as THREE from "three";

type WaveName = "top" | "middle" | "bottom";

type WavePosition = {
  x?: number;
  y?: number;
  rotate?: number;
};

export type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: WaveName[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
};

const MAX_GRADIENT_STOPS = 8;
const DEFAULT_ENABLED_WAVES: WaveName[] = ["top", "middle", "bottom"];
const DEFAULT_GRADIENT = ["#4557f5", "#758bff", "#dbe4ff"];
const DEFAULT_TOP_POSITION: WavePosition = { x: 10, y: 0.5, rotate: -0.4 };
const DEFAULT_MIDDLE_POSITION: WavePosition = { x: 5, y: 0, rotate: 0.2 };
const DEFAULT_BOTTOM_POSITION: WavePosition = { x: 2, y: -0.7, rotate: 0.4 };

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;
uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;
uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;
uniform bool parallax;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

mat2 rotate(float angle) {
  return mat2(cos(angle), sin(angle), -sin(angle), cos(angle));
}

vec3 getLineColor(float t) {
  if (lineGradientCount <= 0) return vec3(0.24, 0.34, 0.96);
  if (lineGradientCount == 1) return lineGradient[0] * 0.5;

  float scaled = clamp(t, 0.0, 0.9999) * float(lineGradientCount - 1);
  int index = int(floor(scaled));
  float mixAmount = fract(scaled);
  int nextIndex = min(index + 1, lineGradientCount - 1);
  return mix(lineGradient[index], lineGradient[nextIndex], mixAmount) * 0.5;
}

float wave(vec2 uv, float offset, vec2 screenUv, vec2 mouseUv, bool shouldBend) {
  float time = iTime * animationSpeed;
  float movement = time * 0.1;
  float amplitude = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + movement) * amplitude;

  if (shouldBend) {
    vec2 distanceFromMouse = screenUv - mouseUv;
    float influence = exp(-dot(distanceFromMouse, distanceFromMouse) * bendRadius);
    y += (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
  }

  float distanceFromLine = uv.y - y;
  return 0.0175 / max(abs(distanceFromLine) + 0.01, 1e-3) + 0.01;
}

void main() {
  vec2 uv = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  uv.y *= -1.0;
  if (parallax) uv += parallaxOffset;

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  vec3 color = vec3(0.0);

  if (enableBottom) {
    for (int i = 0; i < bottomLineCount; i++) {
      float index = float(i);
      float t = index / max(float(bottomLineCount - 1), 1.0);
      float angle = bottomWavePosition.z * log(length(uv) + 1.0);
      vec2 rotatedUv = uv * rotate(angle);
      color += getLineColor(t) * wave(
        rotatedUv + vec2(bottomLineDistance * index + bottomWavePosition.x, bottomWavePosition.y),
        1.5 + 0.2 * index,
        uv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int i = 0; i < middleLineCount; i++) {
      float index = float(i);
      float t = index / max(float(middleLineCount - 1), 1.0);
      float angle = middleWavePosition.z * log(length(uv) + 1.0);
      vec2 rotatedUv = uv * rotate(angle);
      color += getLineColor(t) * wave(
        rotatedUv + vec2(middleLineDistance * index + middleWavePosition.x, middleWavePosition.y),
        2.0 + 0.15 * index,
        uv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int i = 0; i < topLineCount; i++) {
      float index = float(i);
      float t = index / max(float(topLineCount - 1), 1.0);
      float angle = topWavePosition.z * log(length(uv) + 1.0);
      vec2 rotatedUv = uv * rotate(angle);
      rotatedUv.x *= -1.0;
      color += getLineColor(t) * wave(
        rotatedUv + vec2(topLineDistance * index + topWavePosition.x, topWavePosition.y),
        1.0 + 0.2 * index,
        uv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function hexToVector3(hex: string) {
  const value = hex.trim().replace(/^#/, "");
  const normalized = value.length === 3
    ? value.split("").map((part) => `${part}${part}`).join("")
    : value.padEnd(6, "f").slice(0, 6);
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return new THREE.Vector3(
    Number.isNaN(red) ? 1 : red / 255,
    Number.isNaN(green) ? 1 : green / 255,
    Number.isNaN(blue) ? 1 : blue / 255,
  );
}

export default function FloatingLines({
  linesGradient = DEFAULT_GRADIENT,
  enabledWaves = DEFAULT_ENABLED_WAVES,
  lineCount = 6,
  lineDistance = 5,
  topWavePosition = DEFAULT_TOP_POSITION,
  middleWavePosition = DEFAULT_MIDDLE_POSITION,
  bottomWavePosition = DEFAULT_BOTTOM_POSITION,
  animationSpeed = 1.1,
  interactive = true,
  bendRadius = 19,
  bendStrength = -9,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetMouseRef = useRef(new THREE.Vector2(-1000, -1000));
  const currentMouseRef = useRef(new THREE.Vector2(-1000, -1000));
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef(new THREE.Vector2(0, 0));
  const currentParallaxRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch {
      return;
    }

    let active = true;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    container.appendChild(renderer.domElement);

    const countFor = (waveName: WaveName) => {
      if (typeof lineCount === "number") return lineCount;
      if (!enabledWaves.includes(waveName)) return 0;
      return lineCount[enabledWaves.indexOf(waveName)] ?? 6;
    };
    const distanceFor = (waveName: WaveName) => {
      if (typeof lineDistance === "number") return lineDistance * 0.01;
      if (!enabledWaves.includes(waveName)) return 0.01;
      return (lineDistance[enabledWaves.indexOf(waveName)] ?? 0.1) * 0.01;
    };
    const topLineCount = enabledWaves.includes("top") ? countFor("top") : 0;
    const middleLineCount = enabledWaves.includes("middle") ? countFor("middle") : 0;
    const bottomLineCount = enabledWaves.includes("bottom") ? countFor("bottom") : 0;
    const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes("top") },
      enableMiddle: { value: enabledWaves.includes("middle") },
      enableBottom: { value: enabledWaves.includes("bottom") },
      topLineCount: { value: topLineCount },
      middleLineCount: { value: middleLineCount },
      bottomLineCount: { value: bottomLineCount },
      topLineDistance: { value: distanceFor("top") },
      middleLineDistance: { value: distanceFor("middle") },
      bottomLineDistance: { value: distanceFor("bottom") },
      topWavePosition: { value: new THREE.Vector3(topWavePosition.x ?? 10, topWavePosition.y ?? 0.5, topWavePosition.rotate ?? -0.4) },
      middleWavePosition: { value: new THREE.Vector3(middleWavePosition.x ?? 5, middleWavePosition.y ?? 0, middleWavePosition.rotate ?? 0.2) },
      bottomWavePosition: { value: new THREE.Vector3(bottomWavePosition.x ?? 2, bottomWavePosition.y ?? -0.7, bottomWavePosition.rotate ?? 0.4) },
      iMouse: { value: new THREE.Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxOffset: { value: new THREE.Vector2(0, 0) },
      lineGradient: { value: Array.from({ length: MAX_GRADIENT_STOPS }, () => new THREE.Vector3(1, 1, 1)) },
      lineGradientCount: { value: stops.length },
    };

    stops.forEach((stop, index) => {
      uniforms.lineGradient.value[index].copy(hexToVector3(stop));
    });

    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    const setSize = () => {
      if (!active) return;
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.set(renderer.domElement.width, renderer.domElement.height, 1);
    };

    setSize();
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(setSize) : null;
    resizeObserver?.observe(container);

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const pixelRatio = renderer.getPixelRatio();
      targetMouseRef.current.set(x * pixelRatio, (bounds.height - y) * pixelRatio);
      targetInfluenceRef.current = 1;

      if (parallax) {
        targetParallaxRef.current.set(
          ((x - bounds.width / 2) / bounds.width) * parallaxStrength,
          -((y - bounds.height / 2) / bounds.height) * parallaxStrength,
        );
      }
    };
    const handlePointerLeave = () => {
      targetInfluenceRef.current = 0;
      targetParallaxRef.current.set(0, 0);
    };

    if (interactive) {
      renderer.domElement.addEventListener("pointermove", handlePointerMove);
      renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    }

    const clock = new THREE.Clock();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    const renderFrame = () => {
      uniforms.iTime.value = clock.getElapsedTime();

      if (interactive) {
        currentMouseRef.current.lerp(targetMouseRef.current, mouseDamping);
        uniforms.iMouse.value.copy(currentMouseRef.current);
        currentInfluenceRef.current += (targetInfluenceRef.current - currentInfluenceRef.current) * mouseDamping;
        uniforms.bendInfluence.value = currentInfluenceRef.current;
      }
      if (parallax) {
        currentParallaxRef.current.lerp(targetParallaxRef.current, mouseDamping);
        uniforms.parallaxOffset.value.copy(currentParallaxRef.current);
      }

      renderer.render(scene, camera);
    };
    const animate = () => {
      if (!active) return;
      renderFrame();
      animationFrame = window.requestAnimationFrame(animate);
    };
    const syncMotionPreference = () => {
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
    reducedMotion.addEventListener("change", syncMotionPreference);

    return () => {
      active = false;
      window.cancelAnimationFrame(animationFrame);
      reducedMotion.removeEventListener("change", syncMotionPreference);
      resizeObserver?.disconnect();
      if (interactive) {
        renderer.domElement.removeEventListener("pointermove", handlePointerMove);
        renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [
    animationSpeed,
    bendRadius,
    bendStrength,
    bottomWavePosition,
    enabledWaves,
    interactive,
    lineCount,
    lineDistance,
    linesGradient,
    middleWavePosition,
    mouseDamping,
    parallax,
    parallaxStrength,
    topWavePosition,
  ]);

  return <div ref={containerRef} className="floating-lines-container" style={{ mixBlendMode }} aria-hidden="true" />;
}
