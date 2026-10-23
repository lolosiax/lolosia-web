import { Mesh, PlaneGeometry, ShaderMaterial, Vector3, Vector4 } from 'three'

const RIPPLE_SLOTS = 3

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
  uniform vec4 uRipples[3];
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
    return h;
  }

  vec2 rippleGradient(vec2 p) {
    vec2 grad = vec2(0.0);
    for (int i = 0; i < 3; i++) {
      vec4 r = uRipples[i];
      float age = uTime - r.z;
      if (r.w <= 0.001 || age < 0.0 || age > 2.2) continue;
      vec2 delta = p - r.xy;
      float d = max(length(delta), 0.001);
      float band = d - age * 1.25;
      float envelope = exp(-abs(band) * 4.5) * exp(-age * 1.4) * r.w;
      float slope = cos(band * 9.0) * 9.0 - sin(band * 9.0) * 4.5 * sign(band);
      grad += (delta / d) * slope * envelope * 0.05;
    }
    return grad;
  }

  void main() {
    vec2 p = vWorld * 0.8;
    float step = 0.04;
    float h = wave(p);
    float hx = wave(p + vec2(step, 0.0));
    float hz = wave(p + vec2(0.0, step));
    vec2 rip = rippleGradient(p);
    vec3 normal = normalize(vec3((h - hx) * 3.0 - rip.x, 1.0, (h - hz) * 3.0 - rip.y));

    vec3 viewDir = normalize(vView);
    float fresnel = pow(1.0 - clamp(dot(normal, viewDir), 0.0, 1.0), 2.0);
    float slope = clamp(length(normal.xz) * 5.0, 0.0, 1.0);

    vec3 light = normalize(vec3(-0.35, 0.85, 0.4));
    float gloss = pow(max(dot(reflect(-light, normal), viewDir), 0.0), 64.0);

    vec3 color = mix(uDeep, uPale, clamp(fresnel * 0.72 + slope * 0.16, 0.0, 1.0));
    color = mix(color, uSky, fresnel * 0.2);
    color += vec3(1.0, 0.96, 1.0) * gloss * 0.5;
    color += vec3(1.0, 0.97, 1.0) * clamp(length(rip) * 0.3, 0.0, 0.2);

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
  const uRipples = {
    value: Array.from({ length: RIPPLE_SLOTS }, () => new Vector4(0, 0, -100, 0))
  }
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime,
      uRipples,
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

  let rippleIndex = 0

  function update(elapsed: number): void {
    uTime.value = elapsed
  }

  /** 在世界坐标 x / z 处生成一圈涟漪。 */
  function emitRipple(x: number, z: number, strength = 1): void {
    const ripple = uRipples.value[rippleIndex]
    rippleIndex = (rippleIndex + 1) % RIPPLE_SLOTS
    ripple?.set(x * 0.8, z * 0.8, uTime.value, strength)
  }

  function dispose(): void {
    geometry.dispose()
    material.dispose()
  }

  return { mesh, update, emitRipple, dispose }
}
