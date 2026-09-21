import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

// Stack of extruded floor slabs driven by the mock building data with an
// interactive explosion height slider to adjust slice gaps.
export default function Building3DScene({ floors = 3, basements = 1, unitFloor = 3, size = 2 }) {
  const [spin, setSpin] = useState(false)
  const [userGap, setUserGap] = useState(0.18) // interactive height gap between floor slices (m)
  const slab = { w: size, d: size * 0.8, h: 0.35 }
  const gap = userGap
  const levels = []
  for (let b = basements; b >= 1; b--) {
    levels.push({ key: `b${b}`, y: -basements * (slab.h + gap) + (basements - b + 0.5) * (slab.h + gap), accent: false })
  }
  for (let f = 1; f <= floors; f++) {
    levels.push({ key: `f${f}`, y: (f - 0.5) * (slab.h + gap), accent: f === unitFloor })
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 240 }}>
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
          autoRotate={false}
          enablePan={false}
        />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(4px)',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 11,
        color: '#1e293b',
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        zIndex: 10
      }}>
        <span>slice gap</span>
        <input
          type="range"
          min="0"
          max="0.6"
          step="0.02"
          value={userGap}
          onChange={(e) => setUserGap(parseFloat(e.target.value) || 0)}
          style={{ width: 70, cursor: 'pointer' }}
        />
        <b className="mono">{(userGap * 10).toFixed(1)}m</b>
      </div>
    </div>
  )
}