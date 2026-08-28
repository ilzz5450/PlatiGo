"use client"

import * as React from "react"
import * as THREE from "three"
import Image from "next/image"

export function GalaxyBackground() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene, camera, renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 400

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Star / Galaxy Particles
    const particleCount = 1500
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position spread across galaxy/space
      positions[i] = (Math.random() - 0.5) * 1200
      positions[i + 1] = (Math.random() - 0.5) * 1200
      positions[i + 2] = (Math.random() - 0.5) * 1200

      // Falling / drifting velocity (star falling effect)
      velocities[i] = (Math.random() - 0.5) * 0.5
      velocities[i + 1] = -Math.random() * 2 - 0.5 // Falling downwards
      velocities[i + 2] = (Math.random() - 0.5) * 0.5
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))

    // Particle material (glowing soft white/blue stars)
    const canvas = document.createElement("canvas")
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext("2d")
    if (ctx) {
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
      gradient.addColorStop(0.5, "rgba(200, 220, 255, 0.5)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 16, 16)
    }

    const texture = new THREE.CanvasTexture(canvas)

    const material = new THREE.PointsMaterial({
      size: 3,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const starField = new THREE.Points(geometry, material)
    scene.add(starField)

    // Animation loop
    let animationFrameId: number
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const posAttr = geometry.attributes.position as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        arr[i3 + 1] += velocities[i3 + 1] // Fall down
        arr[i3] += velocities[i3]

        // Reset if star falls below view
        if (arr[i3 + 1] < -600) {
          arr[i3 + 1] = 600
          arr[i3] = (Math.random() - 0.5) * 1200
        }
      }
      posAttr.needsUpdate = true

      starField.rotation.y += 0.0005

      renderer.render(scene, camera)
    }

    animate()

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationFrameId)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black"
    >
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none select-none">
       
      </div>
    </div>
  )
}
