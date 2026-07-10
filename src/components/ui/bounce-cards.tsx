'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './bounce-cards.css'

interface BounceCardsProps {
  className?: string
  images?: string[]
  children?: React.ReactNode[]
  containerWidth?: number | string
  containerHeight?: number | string
  animationDelay?: number
  animationStagger?: number
  easeType?: string
  transformStyles?: string[]
  enableHover?: boolean
}

export default function BounceCards({
  className = '',
  images = [],
  children = [],
  containerWidth = 400,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)'
  ],
  enableHover = true
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  const itemsCount = children.length > 0 ? children.length : images.length

  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bounce-card',
        { scale: 0 },
        {
          scale: 1,
          stagger: animationStagger,
          ease: easeType,
          delay: animationDelay
        }
      )
    }, containerRef)
    return () => ctx.revert()
  }, [animationStagger, easeType, animationDelay, itemsCount])

  const getNoRotationTransform = (transformStr: string) => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr)
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)')
    } else if (transformStr === 'none') {
      return 'rotate(0deg)'
    } else {
      return `${transformStr} rotate(0deg)`
    }
  }

  const getPushedTransform = (baseTransform: string, offsetX: number) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/
    const match = baseTransform.match(translateRegex)
    if (match) {
      const currentX = parseFloat(match[1])
      const newX = currentX + offsetX
      return baseTransform.replace(translateRegex, `translate(${newX}px)`)
    } else {
      return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`
    }
  }

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover || !containerRef.current) return

    const q = gsap.utils.selector(containerRef)

    for (let i = 0; i < itemsCount; i++) {
      const target = q(`.card-${i}`)
      gsap.killTweensOf(target)

      const baseTransform = transformStyles[i] || 'none'

      if (i === hoveredIdx) {
        const noRotationTransform = getNoRotationTransform(baseTransform)
        gsap.to(target, {
          transform: noRotationTransform,
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        })
      } else {
        const offsetX = i < hoveredIdx ? -140 : 140
        const pushedTransform = getPushedTransform(baseTransform, offsetX)

        const distance = Math.abs(hoveredIdx - i)
        const delay = distance * 0.05

        gsap.to(target, {
          transform: pushedTransform,
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto'
        })
      }
    }
  }

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return

    const q = gsap.utils.selector(containerRef)

    for (let i = 0; i < itemsCount; i++) {
      const target = q(`.card-${i}`)
      gsap.killTweensOf(target)
      const baseTransform = transformStyles[i] || 'none'
      gsap.to(target, {
        transform: baseTransform,
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      })
    }
  }

  return (
    <div
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight
      }}
    >
      {children.length > 0 ? (
        children.map((child, idx) => (
          <div
            key={idx}
            className={`bounce-card card-${idx}`}
            style={{
              transform: transformStyles[idx] ?? 'none'
            }}
            onMouseEnter={() => pushSiblings(idx)}
            onMouseLeave={resetSiblings}
          >
            {child}
          </div>
        ))
      ) : (
        images.map((src, idx) => (
          <div
            key={idx}
            className={`bounce-card card-${idx}`}
            style={{
              transform: transformStyles[idx] ?? 'none'
            }}
            onMouseEnter={() => pushSiblings(idx)}
            onMouseLeave={resetSiblings}
          >
            <img className="image" src={src} alt={`card-${idx}`} />
          </div>
        ))
      )}
    </div>
  )
}
