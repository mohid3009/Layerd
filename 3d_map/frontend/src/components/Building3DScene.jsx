import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Stack of extruded floor slabs driven by the mock building data. The
// selected unit's floor is rendered in the accent red at full opacity; all
// other floors are neutral grey-blue with slight transparency. Auto-rotates
// until the user grabs the scene.
export default function Building3DScene({ floors = 3, basements = 1, unitFloor = 3, size = 2 }) {
  const [spin, setSpin] = useState(true)
  const slab = { w: size, d: size * 0.8, h: 0.35 }
  const gap = 0.14
  const levels = []
  for (let b = basements; b >= 1; b--) {
    levels.push({ key: `b${b}`, y: -basements * (slab.h + gap) + (basements - b + 0.5) * (slab.h + gap), accent: false })
  }
  for (let f = 1; f <= floors; f++) {
    levels.push({ key: `f${f}`, y: (f - 0.5) * (slab.h + gap), accent: f === unitFloor })
  }
  return (
    <Canvas shadows camera={{ position: [4.4, 3.2, 5.4], fov: 40 }} dpr={[1, 2]}>
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 7, 3]} intensity={1.1} castShadow />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -basements * (slab.h + gap) - 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[size * 1.7, 48]} />
        <meshStandardMaterial color="#EDEDEF" />
      </mesh>
      {levels.map((l) => (
        <mesh key={l.key} position={[0, l.y, 0]} castShadow receiveShadow>
          <boxGeometry args={[slab.w, slab.h, slab.d]} />
          <meshStandardMaterial
            color={l.accent ? '#D6423A' : '#8FA3B8'}
            transparent={!l.accent}
            opacity={l.accent ? 1 : 0.82}
          />
        </mesh>
      ))}
      <OrbitControls
        autoRotate={spin}
        autoRotateSpeed={1.2}
        enablePan={false}
        onStart={() => setSpin(false)}
      />
    </Canvas>
  )
}