// Visual Effects - Explosions, Shockwaves, Particles, Impacts
// Depends on: scene-setup.js (scene, towers global variables)

function spawnUnit(team) {
    const geometry = new THREE.SphereGeometry(0.5);
    const material = new THREE.MeshPhongMaterial({
        color: team === 'blue' ? 0x4444ff : 0xff4444,
        emissive: team === 'blue' ? 0x2222ff : 0xff2222,
        emissiveIntensity: 0.3
    });
    
    const unit = new THREE.Mesh(geometry, material);
    unit.position.set(
        team === 'blue' ? -18 : 18,
        1,
        (Math.random() - 0.5) * 6
    );
    unit.castShadow = true;
    unit.userData = {
        team,
        velocity: team === 'blue' ? 0.08 : -0.08,
        health: 100
    };
    
    scene.add(unit);
    units.push(unit);
    
    // Add spawn effect
    createSpawnEffect(unit.position, team === 'blue' ? 0x4444ff : 0xff4444);
}

function createSpawnEffect(position, color) {
    const geometry = new THREE.RingGeometry(0.1, 1, 8);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
    
    // Animate the ring
    const animateRing = () => {
        ring.scale.x += 0.1;
        ring.scale.y += 0.1;
        material.opacity -= 0.02;
        
        if (material.opacity > 0) {
            requestAnimationFrame(animateRing);
        } else {
            scene.remove(ring);
        }
    };
    animateRing();
}

// Add explosion effect function
function createExplosion(position) {
    const particleCount = 20;
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.1);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.1, 1, 0.5 + Math.random() * 0.5),
            transparent: true,
            opacity: 0.8
        });
        
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        
        particle.userData = { velocity, life: 1 };
        scene.add(particle);
        particles.push(particle);
    }
    
    const animateExplosion = () => {
        let allDead = true;
        
        particles.forEach(particle => {
            if (particle.userData.life > 0) {
                allDead = false;
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.01; // gravity
                particle.userData.life -= 0.02;
                particle.material.opacity = particle.userData.life;
                particle.scale.multiplyScalar(0.98);
                
                if (particle.userData.life <= 0) {
                    scene.remove(particle);
                }
            }
        });
        
        if (!allDead) {
            requestAnimationFrame(animateExplosion);
        }
    };
    
    animateExplosion();
}

// Shockwave ring expanding from impact
function createShockwave(position) {
    const geometry = new THREE.RingGeometry(0.1, 0.3, 32);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2; // Lay flat on ground
    scene.add(ring);
    
    let scale = 1;
    const animateRing = () => {
        scale += 0.5;
        ring.scale.set(scale, scale, 1);
        material.opacity -= 0.02;
        
        if (material.opacity > 0) {
            requestAnimationFrame(animateRing);
        } else {
            scene.remove(ring);
            geometry.dispose();
            material.dispose();
        }
    };
    animateRing();
}

// Explosion particle burst
function createExplosionBurst(position, winner) {
    const particleCount = 30;
    const color = winner === 'blue' ? 0x4444ff : winner === 'red' ? 0xff4444 : 0xffaa00;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        
        // Random direction
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 0.3 + Math.random() * 0.2;
        const velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.random() * 0.5,
            Math.sin(angle) * speed
        );
        
        particle.userData.velocity = velocity;
        scene.add(particle);
        
        // Animate particle
        const animateParticle = () => {
            particle.position.add(particle.userData.velocity);
            particle.userData.velocity.y -= 0.02; // Gravity
            material.opacity -= 0.02;
            particle.scale.multiplyScalar(0.95);
            
            if (material.opacity > 0 && particle.position.y > 0) {
                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
                geometry.dispose();
                material.dispose();
            }
        };
        animateParticle();
    }
}

// Create bright flash at impact
function createImpactFlash(position) {
    const geometry = new THREE.SphereGeometry(3, 16, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const flash = new THREE.Mesh(geometry, material);
    flash.position.copy(position);
    scene.add(flash);
    
    let scale = 1;
    const animateFlash = () => {
        scale += 0.8;
        flash.scale.set(scale, scale, scale);
        material.opacity -= 0.1;
        
        if (material.opacity > 0) {
            requestAnimationFrame(animateFlash);
        } else {
            scene.remove(flash);
            if (geometry) geometry.dispose();
            if (material) material.dispose();
        }
    };
    animateFlash();
}

// Screen flash overlay effect
function createScreenFlash(winner) {
    const color = winner === 'blue' ? '#4444ff' : winner === 'red' ? '#ff4444' : '#ffaa00';
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = color;
    overlay.style.opacity = '0.6';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    overlay.style.transition = 'opacity 0.3s';
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => document.body.removeChild(overlay), 300);
    }, 100);
}

// Create spiral particle
function createSpiralParticle(centerPos, color, index) {
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(centerPos);
    scene.add(particle);
    
    const angle = (index / 12) * Math.PI * 2;
    let radius = 0;
    let height = 0;
    
    const animateSpiral = () => {
        radius += 0.15;
        height += 0.1;
        particle.position.x = centerPos.x + Math.cos(angle + radius * 0.5) * radius;
        particle.position.z = centerPos.z + Math.sin(angle + radius * 0.5) * radius;
        particle.position.y = centerPos.y + height;
        material.opacity -= 0.02;
        
        if (material.opacity > 0 && radius < 10) {
            requestAnimationFrame(animateSpiral);
        } else {
            scene.remove(particle);
            if (geometry) geometry.dispose();
            if (material) material.dispose();
        }
    };
    animateSpiral();
}

// Helper function to create impact ring with parameters
function createImpactRing(position, color, maxSize = 1.5, fadeSpeed = 0.04) {
    const geometry = new THREE.RingGeometry(0.2, maxSize, 32);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    // Animate the ring - slower expansion
    let scale = 1;
    const animateRing = () => {
        scale += 0.15;
        ring.scale.set(scale, scale, 1);
        material.opacity -= fadeSpeed;

        if (material.opacity > 0) {
            requestAnimationFrame(animateRing);
        } else {
            scene.remove(ring);
            if (geometry) geometry.dispose();
            if (material) material.dispose();
        }
    };
    animateRing();
}

// Create impact effect at position
function createImpactEffect(position, attackTeam) {
    const color = attackTeam === 'blue' ? 0x4444ff : 0xff4444;
    
    // Create ring effect
    const geometry = new THREE.RingGeometry(0.2, 1.5, 16);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.position.copy(position);
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);

    // Animate the ring
    let scale = 1;
    const animateRing = () => {
        scale += 0.15;
        ring.scale.set(scale, scale, 1);
        material.opacity -= 0.03;

        if (material.opacity > 0) {
            requestAnimationFrame(animateRing);
        } else {
            scene.remove(ring);
        }
    };
    animateRing();

    // Also trigger explosion particles
    createExplosion(position);
}

// Update tower health visually
function updateTowerHealth(team, health) {
    towers.forEach(tower => {
        if (tower.userData.team === team && tower.userData.crystal) {
            // Change crystal color based on health
            const crystal = tower.userData.crystal;
            const glow = tower.userData.glow;
            
            if (health > 60) {
                // Healthy - keep original color
                if (team === 'blue') {
                    crystal.material.color.setHex(0x6666ff);
                    crystal.material.emissive.setHex(0x6666ff);
                } else {
                    crystal.material.color.setHex(0xff6666);
                    crystal.material.emissive.setHex(0xff6666);
                }
            } else if (health > 30) {
                // Damaged - orange/yellow
                crystal.material.color.setHex(0xffaa44);
                crystal.material.emissive.setHex(0xff8800);
            } else {
                // Critical - dark red
                crystal.material.color.setHex(0xff2222);
                crystal.material.emissive.setHex(0xaa0000);
            }

            // Scale based on health
            const scale = 0.5 + (health / 100) * 0.5;
            crystal.scale.set(scale, scale, scale);
            if (glow) {
                glow.material.opacity = 0.3 * (health / 100);
            }
        }
    });
}

// Send impact wave from center to tower
function createImpactWave(team) {
    return new Promise((resolveWave) => {
        const centerPos = new THREE.Vector3(0, 10, 0);
        const tower = towers.find(t => t.userData.team === team);
        
        if (!tower) {
            resolveWave();
            return;
        }
        
        const targetPos = tower.position.clone();
        targetPos.y += 10;
        
        const winColor = team === 'blue' ? 0xff4444 : 0x4444ff; // Opposite color hits you
        
        // Create wave sphere with trail
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: winColor,
            transparent: true,
            opacity: 0.8,
            emissive: winColor,
            emissiveIntensity: 0.7
        });
        const wave = new THREE.Mesh(geometry, material);
        wave.position.copy(centerPos);
        scene.add(wave);
        
        // Add glow around wave
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: winColor,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(centerPos);
        scene.add(glow);
        
        // Animate to tower - slower for dramatic effect
        const startPos = centerPos.clone();
        const endPos = targetPos;
        let progress = 0;
        const trailParticles = [];
        
        const animateWave = () => {
            progress += 0.04; // Faster travel
            
            if (progress >= 1) {
                // Hit tower with big impact
                createImpactEffect(endPos, team === 'blue' ? 'red' : 'blue');
                createImpactRing(endPos, winColor, 2, 0.06);
                scene.remove(wave);
                scene.remove(glow);
                
                // Clean up trail
                trailParticles.forEach(p => {
                    scene.remove(p);
                    if (p.material) p.material.dispose();
                });
                
                // Shake tower dramatically
                if (tower.userData.crystal) {
                    const originalY = tower.userData.crystal.position.y;
                    const originalScale = tower.userData.crystal.scale.x;
                
                // Bounce effect
                tower.userData.crystal.position.y += 1;
                tower.userData.crystal.scale.set(originalScale * 0.8, originalScale * 0.8, originalScale * 0.8);
                
                setTimeout(() => {
                    tower.userData.crystal.position.y = originalY - 0.5;
                    tower.userData.crystal.scale.set(originalScale * 1.1, originalScale * 1.1, originalScale * 1.1);
                }, 60);
                
                setTimeout(() => {
                    tower.userData.crystal.position.y = originalY;
                    tower.userData.crystal.scale.set(originalScale, originalScale, originalScale);
                    
                    // Wait a bit more for tower to settle, then resolve
                    setTimeout(() => {
                        console.log('Impact wave animation complete');
                        resolveWave(); // ← RESOLVE THE PROMISE HERE
                    }, 200); // Extra 200ms for tower to settle
                }, 120);
            } else {
                // No crystal, just resolve after a short delay
                setTimeout(() => {
                    console.log('Impact wave animation complete (no crystal)');
                    resolveWave();
                }, 300);
            }
        } else {
            // Move wave with smooth interpolation
            wave.position.lerpVectors(startPos, endPos, progress);
            glow.position.lerpVectors(startPos, endPos, progress);
            
            // Add arc to the trajectory
            const arc = Math.sin(progress * Math.PI) * 3;
            wave.position.y += arc;
            glow.position.y += arc;
            
            // Rotate and pulse
            wave.rotation.x += 0.05;
            wave.rotation.y += 0.05;
            const pulse = 1 + Math.sin(progress * Math.PI * 4) * 0.2;
            wave.scale.set(pulse, pulse, pulse);
            glow.scale.set(pulse * 1.5, pulse * 1.5, pulse * 1.5);
            
            // Leave trail
            if (Math.random() < 0.5) {
                const trailGeometry = new THREE.SphereGeometry(0.3, 8, 8);
                const trailMaterial = new THREE.MeshBasicMaterial({
                    color: winColor,
                    transparent: true,
                    opacity: 0.6
                });
                const trail = new THREE.Mesh(trailGeometry, trailMaterial);
                trail.position.copy(wave.position);
                scene.add(trail);
                trailParticles.push(trail);
                
                // Fade trail
                const fadeTrail = () => {
                    trailMaterial.opacity -= 0.02;
                    trail.scale.multiplyScalar(0.95);
                    if (trailMaterial.opacity > 0) {
                        requestAnimationFrame(fadeTrail);
                    } else {
                        scene.remove(trail);
                        if (trailGeometry) trailGeometry.dispose();
                        if (trailMaterial) trailMaterial.dispose();
                    }
                };
                fadeTrail();
            }
            
            requestAnimationFrame(animateWave);
        }
    };
    animateWave();
    }); // End of Promise
}

// Create lightning bolt geometry
function createLightningBolt(startPos, endPos) {
    const points = [];
    const segments = 12;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = startPos.x + (endPos.x - startPos.x) * t + (Math.random() - 0.5) * 3;
        const y = startPos.y + (endPos.y - startPos.y) * t;
        const z = startPos.z + (endPos.z - startPos.z) * t + (Math.random() - 0.5) * 3;
        points.push(new THREE.Vector3(x, y, z));
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0xaaddff,
        linewidth: 3,
        transparent: true,
        opacity: 1
    });
    
    const bolt = new THREE.Line(geometry, material);
    scene.add(bolt);
    
    // Add glow effect around bolt
    const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const glowMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 6,
        transparent: true,
        opacity: 0.5
    });
    const glow = new THREE.Line(glowGeometry, glowMaterial);
    scene.add(glow);
    
    return { bolt, glow, geometry, material, glowGeometry, glowMaterial };
}

// Lightning flash intro effect
function playLightningIntro() {
    return new Promise((resolve) => {
        const mainLight = scene.userData.mainLight;
        const ambientLight = scene.userData.ambientLight;
        
        if (!mainLight || !ambientLight) {
            resolve();
            return;
        }
        
        const originalMainIntensity = mainLight.intensity;
        const originalAmbientIntensity = ambientLight.intensity;
        
        let flashCount = 0;
        const maxFlashes = 3;
        const flashes = [];
        
        function triggerLightning() {
            // Create multiple lightning bolts
            const boltCount = 2 + Math.floor(Math.random() * 2);
            const currentBolts = [];
            
            for (let i = 0; i < boltCount; i++) {
                const angle = (Math.random() * Math.PI * 2);
                const radius = 20 + Math.random() * 15;
                const startPos = new THREE.Vector3(
                    Math.cos(angle) * radius,
                    40 + Math.random() * 20,
                    Math.sin(angle) * radius
                );
                const endPos = new THREE.Vector3(
                    Math.cos(angle) * (radius * 0.8),
                    -10,
                    Math.sin(angle) * (radius * 0.8)
                );
                
                const boltObj = createLightningBolt(startPos, endPos);
                currentBolts.push(boltObj);
                
                // Create ground impact flash
                const impactGeometry = new THREE.SphereGeometry(2, 16, 16);
                const impactMaterial = new THREE.MeshBasicMaterial({
                    color: 0xaaddff,
                    transparent: true,
                    opacity: 0.8
                });
                const impact = new THREE.Mesh(impactGeometry, impactMaterial);
                impact.position.copy(endPos);
                scene.add(impact);
                currentBolts.push({ bolt: impact, material: impactMaterial, geometry: impactGeometry });
            }
            
            // Intense light flash
            mainLight.intensity = originalMainIntensity * 8;
            ambientLight.intensity = originalAmbientIntensity * 6;
            
            // Quick fade
            setTimeout(() => {
                mainLight.intensity = originalMainIntensity * 2;
                ambientLight.intensity = originalAmbientIntensity * 2;
                
                // Cleanup bolts
                currentBolts.forEach(obj => {
                    if (obj.bolt) scene.remove(obj.bolt);
                    if (obj.glow) scene.remove(obj.glow);
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) obj.material.dispose();
                    if (obj.glowGeometry) obj.glowGeometry.dispose();
                    if (obj.glowMaterial) obj.glowMaterial.dispose();
                });
            }, 80);
            
            setTimeout(() => {
                mainLight.intensity = originalMainIntensity;
                ambientLight.intensity = originalAmbientIntensity;
                
                flashCount++;
                if (flashCount < maxFlashes) {
                    setTimeout(triggerLightning, 300 + Math.random() * 400);
                } else {
                    setTimeout(resolve, 500);
                }
            }, 150);
        }
        
        // Start first lightning after brief delay
        setTimeout(triggerLightning, 500);
    });
}

// Create victory effect
function createVictoryEffect(winner) {
    const color = winner === 'blue' ? 0x4444ff : 0xff4444;
    
    // Create large burst of particles
    for (let i = 0; i < 50; i++) {
        const geometry = new THREE.SphereGeometry(0.2);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });

        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(0, 15, 0);

        const velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.5,
            (Math.random() - 0.5) * 0.5
        );

        particle.userData = { velocity, life: 1 };
        scene.add(particle);

        const animateParticle = () => {
            if (particle.userData.life > 0) {
                particle.position.add(particle.userData.velocity);
                particle.userData.velocity.y -= 0.01;
                particle.userData.life -= 0.01;
                particle.material.opacity = particle.userData.life;

                requestAnimationFrame(animateParticle);
            } else {
                scene.remove(particle);
            }
        };
        animateParticle();
    }
}

