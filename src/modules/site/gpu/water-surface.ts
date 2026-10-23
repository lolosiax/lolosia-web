import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three'

const VERTEX = /* glsl */ `
  uniform float uTime;
  varying vec2 vWorld;
  varying vec3 vView;

  void main() {
    vec3 p = position;
    p.z += sin(p.x * 0.9 + uTime * 0.7) * 0.035;
    p.z += sin(p.y * 1.3 - uTime * 0.55) * 0.028;

    vec4 world = modelMatrix * vec4(p, 1.0);
    vWorld = world.xz;
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform vec3 uDeep;
  uniform vec3 uPale;
  uniform vec3 uSky;
  varying vec2 vWorld;
  varying vec3 vView;

  float wave(vec2 p) {
    float h = sin(p.x * 1.6 + uTime * 0.8) * 0.45;
    h += sin(p.y * 2.3 - uTime * 0.6) * 0.35;
    h += sin((p.x * 0.7 + p.y * 1.1) * 2.4 + uTime * 1.1) * 0.22;
    h += sin((p.x - p.y) * 3.7 - uTime * 0.9) * 0.12;
    float d = distance(p, uPointer);
    h += sin(d * 4.0 - uTime * 2.0) * exp(-d * 1.1) * 0.45;
    return h;
  }

  void main() {
    vec2 p = vWorld * 0.8;
    float step = 0.04;
    float h = wave(p);
    float hx = wave(p + vec2(step, 0.0));
    float hz = wave(p + vec2(0.0, step));
    vec3 normal = normalize(vec3((h - hx) * 3.0, 1.0, (h - hz) * 3.0));

    vec3 viewDir = normalize(vView);
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.0);
    float slope = clamp(length(normal.xz) * 5.0, 0.0, 1.0);

    vec3 light = normalize(vec3(-0.35, 0.85, 0.4));
    float gloss = pow(max(dot(reflect(-light, normal), viewDir), 0.0), 64.0);

    vec3 color = mix(uDeep, uPale, clamp(fresnel * 0.72 + slope * 0.16, 0.0, 1.0));
    color = mix(color, uSky, fresnel * 0.2);
    color += vec3(1.0, 0.96, 1.0) * gloss * 0.5;

    float sheen = sin(vWorld.x * 0.5 + uTime * 0.16) * 0.5 + 0.5;
    color += vec3(1.0, 0.92, 0.98) * sheen * 0.02;

    float distanceFade = smoothstep(28.0, 6.0, length(vWorld));
    color = mix(uSky, color, clamp(distanceFade, 0.0, 1.0));

    gl_FragColor = vec4(color, 1.0);
  }
`

export interface WaterSurfaceOptions {
  deep: Vector3
  pale: Vector3
  sky: Vector3
}

/** 倾斜视角下的水面：多重正弦波 + 鼠标扩散涟漪 + 菲涅尔反射。 */
export function createWaterSurface(options: WaterSurfaceOptions) {
  const geometry = new PlaneGeometry(44, 44, 1, 1)
  const uTime = { value: 0 }
  const uPointer = { value: new Vector2(0, 0) }
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime,
      uPointer,
      uDeep: { value: options.deep },
      uPale: { value: options.pale },
      uSky: { value: options.sky }
    }
  })
  material.name = 'water'

  const mesh = new Mesh(geometry, material)
  mesh.name = 'water'
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -2
  mesh.renderOrder = 0

  function update(elapsed: number): void {
    uTime.value = elapsed
  }

  function setPointer(x: number, z: number): void {
    uPointer.value.set(x, z)
  }

  function dispose(): void {
    geometry.dispose()
    material.dispose()
  }

  return { mesh, update, setPointer, dispose }
}
