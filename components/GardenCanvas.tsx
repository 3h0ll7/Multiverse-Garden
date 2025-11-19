
import React, { useRef, useEffect } from 'react';
import { ThemeColors, Particle, Plant, Ripple, THEMES, ThemeType } from '../constants';
import { playSound } from '../utils/audio';

interface GardenCanvasProps {
  themeType: ThemeType;
  setRecorderStream: (stream: MediaStream | null) => void;
}

// Easing function for organic elastic growth (overshoots then settles)
const easeOutElastic = (x: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
};

const GardenCanvas: React.FC<GardenCanvasProps> = ({ themeType, setRecorderStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const theme = useRef<ThemeColors>(THEMES[themeType]);
  
  // Game State
  const particles = useRef<Particle[]>([]);
  const plants = useRef<Plant[]>([]);
  const ripples = useRef<Ripple[]>([]);
  
  const isWaterFrozen = useRef<boolean>(false);
  const waterFreezeTimer = useRef<any>(null);
  const isPortalOpen = useRef<boolean>(false);
  const doubleTapExplosion = useRef<number>(0); // 0 to 1 progress
  
  // Input Tracking
  const lastTapTime = useRef<number>(0);
  const longPressTimer = useRef<any>(null);
  const isDragging = useRef<boolean>(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);

  // Update theme ref when prop changes
  useEffect(() => {
    theme.current = THEMES[themeType];
  }, [themeType]);

  // --- Helper Functions ---

  const spawnParticle = (x: number, y: number, type: Particle['type'], count = 1) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (type === 'TRAIL' ? 0.5 : 2),
        vy: (Math.random() - 0.5) * (type === 'ORB' ? 4 : 2) - (type === 'ORB' ? 1 : 0),
        life: 1.0,
        maxLife: 1.0 + Math.random(),
        size: Math.random() * (type === 'ORB' ? 10 : 3) + 2,
        color: type === 'ORB' ? theme.current.orb : theme.current.portal,
        type
      });
    }
  };

  const spawnPlant = (x: number, y: number) => {
    const types: Plant['type'][] = ['GRASS', 'TREE', 'ALIEN_FLOWER'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    // Randomized organic properties
    const maxHeight = 40 + Math.random() * 80;
    const width = type === 'TREE' ? 8 + Math.random() * 6 : 6 + Math.random() * 8;
    const growthSpeed = 0.01 + Math.random() * 0.015; // Random growth speed
    
    plants.current.push({
      x,
      y,
      height: 0,
      maxHeight,
      width,
      growth: 0,
      growthSpeed, 
      swayOffset: Math.random() * 100, // Phase offset for noise
      swaySpeed: 0.5 + Math.random() * 1.0, // Individual flexibility
      color: theme.current.plantBase,
      type
    });
    playSound('GROW');
  };

  const triggerRipple = (x: number, y: number) => {
    ripples.current.push({
      x,
      y,
      radius: 0,
      strength: 1.0,
      life: 1.0
    });
  };

  const freezeWater = () => {
    isWaterFrozen.current = true;
    playSound('SPLASH');
    if (waterFreezeTimer.current) clearTimeout(waterFreezeTimer.current);
    waterFreezeTimer.current = setTimeout(() => {
      isWaterFrozen.current = false;
    }, 2000);
  };

  // --- Drawing Logic ---

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // 1. Sky (Gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.current.skyGradient[0]);
    gradient.addColorStop(0.6, theme.current.skyGradient[1]);
    gradient.addColorStop(1, theme.current.ground);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Explosion Overlay Effect
    if (doubleTapExplosion.current > 0) {
        ctx.globalCompositeOperation = 'hue';
        ctx.fillStyle = `rgba(255,255,255,${doubleTapExplosion.current})`;
        ctx.fillRect(0,0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        doubleTapExplosion.current -= 0.02;
    }

    const waterLevel = height * 0.75;
    const groundLevel = height * 0.70;

    // 2. Background Stars/Ambient (Procedural)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 20; i++) {
        const starX = (i * 1239 + time * 0.2) % width;
        const starY = (i * 837) % (height * 0.6);
        ctx.beginPath();
        ctx.arc(starX, starY, Math.sin(time * 0.005 + i) + 1, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Ground (Hill)
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, groundLevel);
    ctx.bezierCurveTo(width * 0.3, groundLevel - 50, width * 0.7, groundLevel + 20, width, groundLevel);
    ctx.lineTo(width, height);
    ctx.fillStyle = theme.current.ground;
    ctx.fill();

    // 4. Water
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, waterLevel, width, height - waterLevel);
    
    if (isWaterFrozen.current) {
        ctx.fillStyle = 'rgba(200, 240, 255, 0.8)'; // Ice
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
    } else {
        ctx.fillStyle = theme.current.water;
        ctx.shadowBlur = 0;
    }
    ctx.fill();
    
    // Water reflections/ripples
    if (!isWaterFrozen.current) {
        ctx.strokeStyle = theme.current.waterReflection;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const yPos = waterLevel + 20 + i * 30 + Math.sin(time * 0.002 + i) * 10;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            for(let x = 0; x < width; x+=20) {
                ctx.lineTo(x, yPos + Math.sin(x * 0.02 + time * 0.003) * 5);
            }
            ctx.stroke();
        }
    }

    // Active Ripples
    ripples.current.forEach((r, idx) => {
        r.radius += 2;
        r.life -= 0.02;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, r.radius, r.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${r.life})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (r.life <= 0) ripples.current.splice(idx, 1);
    });
    ctx.restore();

    // 5. Plants - Organic Growth & Sway
    // Global wind noise using summed sines
    const windTime = time * 0.001;
    const globalWind = Math.sin(windTime) * 0.5 + Math.sin(windTime * 2.3) * 0.3 + Math.sin(windTime * 0.7) * 0.2;

    plants.current.forEach((p, idx) => {
        // Growth logic
        if (p.growth < 1) {
            p.growth = Math.min(p.growth + p.growthSpeed, 1);
        }
        
        // Elastic Easing for "Pop" effect
        const easedScale = easeOutElastic(p.growth);
        const currentHeight = p.maxHeight * easedScale;
        
        // Calculate Sway
        // Combine global wind + local variance + phase offset
        const localWind = globalWind + Math.sin(time * 0.003 + p.swayOffset) * 0.4;
        // Sway amplitude increases with height and local wind
        const sway = localWind * p.swaySpeed * 15 * p.growth; 

        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.lineCap = 'round';
        
        if (p.type === 'GRASS') {
             // Draw grass as a filled, tapered blade for volume
             ctx.beginPath();
             // Base width
             const halfWidth = p.width * 0.5 * easedScale;
             ctx.moveTo(p.x - halfWidth, p.y);
             
             // Control points for quadratic bezier to create curved blade
             const cpX = p.x + sway * 0.5;
             const cpY = p.y - currentHeight * 0.5;
             const tipX = p.x + sway * 1.5;
             const tipY = p.y - currentHeight;
             
             // Left curve to tip
             ctx.quadraticCurveTo(cpX - halfWidth, cpY, tipX, tipY);
             // Right curve back to base
             ctx.quadraticCurveTo(cpX + halfWidth, cpY, p.x + halfWidth, p.y);
             
             ctx.fill();
             
        } else if (p.type === 'TREE') {
             // Tapered trunk stroke
             ctx.lineWidth = p.width * easedScale;
             ctx.beginPath();
             ctx.moveTo(p.x, p.y);
             
             const trunkTip = { x: p.x + sway * 0.5, y: p.y - currentHeight };
             ctx.quadraticCurveTo(p.x, p.y - currentHeight * 0.4, trunkTip.x, trunkTip.y);
             ctx.stroke();
             
             // Dynamic Branches
             // Only draw branches if tree is grown enough
             if (p.growth > 0.3) {
                 ctx.lineWidth = p.width * 0.6 * easedScale;
                 
                 // Left Branch
                 const lbX = p.x + sway * 0.3;
                 const lbY = p.y - currentHeight * 0.6;
                 ctx.beginPath();
                 ctx.moveTo(lbX, lbY);
                 ctx.quadraticCurveTo(
                     lbX - 15 + sway, 
                     lbY - 10, 
                     lbX - 30 + sway * 1.5, 
                     lbY - 25 + Math.sin(time * 0.005) * 5
                 );
                 ctx.stroke();

                 // Right Branch
                 const rbX = p.x + sway * 0.4;
                 const rbY = p.y - currentHeight * 0.5;
                 ctx.beginPath();
                 ctx.moveTo(rbX, rbY);
                 ctx.quadraticCurveTo(
                     rbX + 15 + sway, 
                     rbY - 15, 
                     rbX + 35 + sway * 1.5, 
                     rbY - 30 + Math.cos(time * 0.005) * 5
                 );
                 ctx.stroke();
             }
        } else {
             // Alien Flower (Pulsing Head)
             const stemTipX = p.x + sway;
             const stemTipY = p.y - currentHeight;
             
             ctx.lineWidth = p.width * 0.4 * easedScale;
             ctx.beginPath();
             ctx.moveTo(p.x, p.y);
             ctx.quadraticCurveTo(p.x + sway * 0.2, p.y - currentHeight * 0.5, stemTipX, stemTipY);
             ctx.stroke();
             
             if (p.growth > 0.2) {
                 const pulse = Math.sin(time * 0.008 + p.swayOffset) * 4;
                 const headSize = (10 + pulse) * easedScale;
                 
                 ctx.fillStyle = theme.current.plantHighlight;
                 ctx.beginPath();
                 ctx.arc(stemTipX, stemTipY, Math.max(0, headSize), 0, Math.PI * 2);
                 
                 // Outer Glow
                 ctx.shadowBlur = 15 * easedScale;
                 ctx.shadowColor = theme.current.plantHighlight;
                 ctx.fill();
                 ctx.shadowBlur = 0;
                 
                 // Inner Core
                 ctx.fillStyle = '#fff';
                 ctx.beginPath();
                 ctx.arc(stemTipX, stemTipY, Math.max(0, headSize * 0.3), 0, Math.PI * 2);
                 ctx.fill();
             }
        }
    });

    // 6. Particles
    particles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        
        if (p.type === 'TRAIL') {
            // Slow motion physics for trails
            p.vx *= 0.9;
            p.vy *= 0.9;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        if (p.life <= 0) particles.current.splice(idx, 1);
    });
    
    // Portal Effect
    if (isPortalOpen.current && lastPos.current) {
        const { x, y } = lastPos.current;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(time * 0.01);
        ctx.strokeStyle = theme.current.portal;
        ctx.lineWidth = 3;
        for(let i=0; i<3; i++) {
            ctx.beginPath();
            ctx.arc(0, 0, 30 + i * 20 + Math.sin(time * 0.01 * i) * 10, 0, Math.PI * 2 - 1);
            ctx.stroke();
            ctx.rotate(1);
        }
        ctx.restore();
        spawnParticle(x + (Math.random()-0.5)*50, y + (Math.random()-0.5)*50, 'PORTAL_DUST');
    }

  };

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            draw(ctx, canvas.width, canvas.height, time);
        }
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    
    // Capture stream for recording
    if (canvasRef.current) {
        try {
            const stream = canvasRef.current.captureStream(60);
            setRecorderStream(stream);
        } catch (e) {
            console.warn("Stream capture not supported");
        }
    }

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [setRecorderStream]);


  // --- Interaction Handlers ---

  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };

    // Double Tap Check
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
        // Double tap!
        doubleTapExplosion.current = 1.0;
        playSound('EXPLOSION');
        spawnParticle(clientX, clientY, 'EXPLOSION', 50);
    }
    lastTapTime.current = now;

    // Long Press Setup
    longPressTimer.current = setTimeout(() => {
        isPortalOpen.current = true;
        playSound('PORTAL');
    }, 600); // 600ms for long press

    // Zone Logic
    const height = window.innerHeight;
    const relativeY = clientY / height;

    if (relativeY > 0.75) {
        freezeWater();
        triggerRipple(clientX, clientY);
    } else if (relativeY > 0.55) {
        spawnPlant(clientX, clientY);
    } else {
        spawnParticle(clientX, clientY, 'ORB', 3);
        playSound('SHIMMER');
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    
    // Cancel long press if moved too much
    if (longPressTimer.current) {
         const dist = Math.hypot(clientX - lastPos.current!.x, clientY - lastPos.current!.y);
         if (dist > 10) {
             clearTimeout(longPressTimer.current);
             longPressTimer.current = null;
             isPortalOpen.current = false;
         }
    }
    
    // Time Distortion Trail
    const speed = Math.hypot(clientX - lastPos.current!.x, clientY - lastPos.current!.y);
    if (speed > 5) {
        spawnParticle(clientX, clientY, 'TRAIL');
    }
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => {
    isDragging.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    isPortalOpen.current = false;
    lastPos.current = null;
  };

  // Resize Handler
  useEffect(() => {
      const handleResize = () => {
          if (canvasRef.current) {
              canvasRef.current.width = window.innerWidth;
              canvasRef.current.height = window.innerHeight;
          }
      };
      window.addEventListener('resize', handleResize);
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block"
      onPointerDown={(e) => handleStart(e.clientX, e.clientY)}
      onPointerMove={(e) => handleMove(e.clientX, e.clientY)}
      onPointerUp={handleEnd}
      onPointerLeave={handleEnd}
    />
  );
};

export default GardenCanvas;
