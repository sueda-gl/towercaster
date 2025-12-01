// Arena, Towers, and Decorations Builder
// Depends on: scene-setup.js (scene, towers global variables)

function createArena() {
    // Create circular arena platform
    const platformGeometry = new THREE.CylinderGeometry(30, 30, 2, 64);
    const platformMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a4a52,
        emissive: 0x1a1a25,
        emissiveIntensity: 0.08,
        roughness: 0.8,
        metalness: 0.15
    });
    arena = new THREE.Mesh(platformGeometry, platformMaterial);
    arena.position.y = -11;
    arena.receiveShadow = true;
    scene.add(arena);
    
    // Add dark earthy ground on the platform
    const groundGeometry = new THREE.CircleGeometry(30, 64);
    const groundMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a1f15,
        emissive: 0x0a0505,
        emissiveIntensity: 0.02,
        roughness: 0.98
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -9.99;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Dark battle ground in the middle
    const pathGeometry = new THREE.CylinderGeometry(6, 6, 0.1, 32);
    const pathMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1510,
        roughness: 0.98,
        metalness: 0.02
    });
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.position.set(0, -9.95, 0);
    path.receiveShadow = true;
    scene.add(path);
    
    // Wooden bridge
    const bridgeGeometry = new THREE.BoxGeometry(10, 0.5, 8);
    const bridgeMaterial = new THREE.MeshPhongMaterial({
        color: 0x8b6914,
        emissive: 0x5c4610,
        emissiveIntensity: 0.03,
        roughness: 0.8
    });
    const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
    bridge.position.set(0, -9.5, 0);
    bridge.receiveShadow = true;
    bridge.castShadow = true;
    scene.add(bridge);
    
    // Bridge railings with wood texture
    const railGeometry = new THREE.BoxGeometry(10, 1.2, 0.3);
    const railMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x6b5030,
        roughness: 0.9 
    });
    
    const rail1 = new THREE.Mesh(railGeometry, railMaterial);
    rail1.position.set(0, -8.5, 4);
    rail1.castShadow = true;
    scene.add(rail1);
    
    const rail2 = new THREE.Mesh(railGeometry, railMaterial);
    rail2.position.set(0, -8.5, -4);
    rail2.castShadow = true;
    scene.add(rail2);
    
    // Add decorative bridge posts
    const postGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2);
    const postMaterial = new THREE.MeshPhongMaterial({ color: 0x5c4030 });
    for (let i = -4; i <= 4; i += 2) {
        const post1 = new THREE.Mesh(postGeometry, postMaterial);
        post1.position.set(i, -8.5, 4);
        post1.castShadow = true;
        scene.add(post1);
        
        const post2 = new THREE.Mesh(postGeometry, postMaterial);
        post2.position.set(i, -8.5, -4);
        post2.castShadow = true;
        scene.add(post2);
    }
    
    // Circular river/moat with darker water
    const waterGeometry = new THREE.CircleGeometry(30, 64);
    const waterMaterial = new THREE.MeshPhongMaterial({
        color: 0x004560,
        transparent: true,
        opacity: 0.8,
        emissive: 0x001520,
        emissiveIntensity: 0.15,
        roughness: 0.3,
        metalness: 0.85
    });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -12.5;
    water.userData = { material: waterMaterial };
    scene.add(water);
    
    // Add dark debris in water
    const debrisGeometry = new THREE.CircleGeometry(0.4, 5);
    const debrisMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1510,
        side: THREE.DoubleSide,
        roughness: 1.0
    });
    
    for (let i = 0; i < 6; i++) {
        const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
        debris.rotation.x = -Math.PI / 2;
        debris.position.set(
            (Math.random() - 0.5) * 30,
            -12.4,
            (Math.random() - 0.5) * 20
        );
        debris.rotation.z = Math.random() * Math.PI;
        scene.add(debris);
    }
    
    // Add crater slopes around the arena
    createCraterSlopes();
    
    // Add snow effect
    createSnowEffect();
    
    // Add clouds
    addClouds();
}

function createCraterSlopes() {
    // Create outer crater wall with earth/dirt texture
    const craterOuterGeometry = new THREE.CylinderGeometry(45, 35, 15, 64, 1, true);
    const craterMaterial = new THREE.MeshPhongMaterial({
        color: 0x3d2f1f,
        emissive: 0x1a1510,
        emissiveIntensity: 0.05,
        roughness: 0.95,
        metalness: 0,
        side: THREE.DoubleSide
    });
    const craterWall = new THREE.Mesh(craterOuterGeometry, craterMaterial);
    craterWall.position.y = -15;
    craterWall.receiveShadow = true;
    craterWall.castShadow = true;
    scene.add(craterWall);
    
    // Add darker bottom rim
    const rimGeometry = new THREE.CylinderGeometry(35, 32, 2, 64);
    const rimMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a1f15,
        emissive: 0x0a0505,
        emissiveIntensity: 0.02,
        roughness: 1.0,
        metalness: 0
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = -21;
    rim.receiveShadow = true;
    scene.add(rim);
    
    // Add rocky texture details on crater walls
    const rockDetailGeometry = new THREE.DodecahedronGeometry(0.8);
    const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x4a3a2a,
        roughness: 0.95,
        flatShading: true
    });
    
    for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 34 + Math.random() * 8;
        const height = -18 + Math.random() * 10;
        
        const rock = new THREE.Mesh(rockDetailGeometry, rockMaterial);
        rock.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        rock.scale.set(
            0.5 + Math.random() * 1.5,
            0.5 + Math.random() * 1.5,
            0.5 + Math.random() * 1.5
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        scene.add(rock);
    }
    
    // Add dirt/earth layers
    for (let i = 0; i < 3; i++) {
        const layerGeometry = new THREE.TorusGeometry(36 + i * 3, 0.8, 8, 32);
        const layerMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.08, 0.3, 0.15 + i * 0.05),
            roughness: 1.0
        });
        const layer = new THREE.Mesh(layerGeometry, layerMaterial);
        layer.position.y = -16 + i * 2;
        layer.rotation.x = Math.PI / 2;
        scene.add(layer);
    }
}

function createSnowEffect() {
    const snowCount = 1500;
    const snowGeometry = new THREE.BufferGeometry();
    const snowPositions = [];
    const snowVelocities = [];
    
    // Create snow particles
    for (let i = 0; i < snowCount; i++) {
        const x = (Math.random() - 0.5) * 100;
        const y = Math.random() * 60;
        const z = (Math.random() - 0.5) * 100;
        
        snowPositions.push(x, y, z);
        snowVelocities.push(
            (Math.random() - 0.5) * 0.003, // x velocity (very gentle drift)
            -0.005 - Math.random() * 0.005,  // y velocity (very slow falling)
            (Math.random() - 0.5) * 0.003   // z velocity (very gentle drift)
        );
    }
    
    snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(snowPositions, 3));
    
    const snowMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        map: createSnowflakeTexture(),
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    const snow = new THREE.Points(snowGeometry, snowMaterial);
    snow.userData = { velocities: snowVelocities };
    scene.add(snow);
    
    // Store snow for animation
    scene.userData.snow = snow;
}

function createSnowflakeTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
    
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

function addClouds() {
    // Create dark storm clouds
    function createCloud(x, y, z) {
        const cloud = new THREE.Group();
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0x404050,
            transparent: true,
            opacity: 0.6,
            emissive: 0x202030,
            emissiveIntensity: 0.05
        });
        
        // Create cloud with multiple spheres
        const positions = [
            [0, 0, 0, 2],
            [1.5, 0.2, 0, 1.8],
            [-1.5, 0, 0.5, 1.6],
            [0.8, -0.3, -0.8, 1.4],
            [-0.8, 0.3, 0.8, 1.5],
            [2.2, 0, -0.5, 1.2],
            [-2.2, 0.1, 0, 1.3]
        ];
        
        positions.forEach(pos => {
            const geometry = new THREE.SphereGeometry(pos[3], 8, 6);
            const sphere = new THREE.Mesh(geometry, cloudMaterial);
            sphere.position.set(pos[0], pos[1], pos[2]);
            sphere.castShadow = false;
            sphere.receiveShadow = false;
            cloud.add(sphere);
        });
        
        cloud.position.set(x, y, z);
        cloud.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
        cloud.userData = { 
            speed: 0.01 + Math.random() * 0.02,
            startX: x
        };
        
        return cloud;
    }
    
    // Add multiple clouds at different heights
    const clouds = [];
    for (let i = 0; i < 8; i++) {
        const cloud = createCloud(
            (Math.random() - 0.5) * 80,
            25 + Math.random() * 15,
            (Math.random() - 0.5) * 60
        );
        scene.add(cloud);
        clouds.push(cloud);
    }
    
    // Store clouds for animation
    scene.userData.clouds = clouds;
}

function createTowers() {
    // Enhanced tower creation function
    function createTower(x, z, color, team) {
        const group = new THREE.Group();
        
        // Stone tower base with texture
        const baseGeometry = new THREE.CylinderGeometry(2.5, 3, 4, 12);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b8680,
            emissive: 0x333333,
            emissiveIntensity: 0.05,
            roughness: 0.95,
            metalness: 0
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 2;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);
        
        // Add stone brick pattern
        for (let i = 0; i < 4; i++) {
            const brickGeometry = new THREE.BoxGeometry(0.3, 0.8, 3.5);
            const brick = new THREE.Mesh(brickGeometry, baseMaterial);
            brick.position.set(
                Math.cos((i / 4) * Math.PI * 2) * 2.5,
                2 + (i % 2) * 0.5,
                Math.sin((i / 4) * Math.PI * 2) * 2.5
            );
            brick.rotation.y = (i / 4) * Math.PI * 2;
            brick.castShadow = true;
            group.add(brick);
        }
        
        // Tower main body with gradient
        const towerGeometry = new THREE.CylinderGeometry(2, 2.5, 7, 8);
        const towerMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(color).lerp(new THREE.Color(0x666666), 0.3),
            emissive: color,
            emissiveIntensity: 0.15,
            roughness: 0.7,
            metalness: 0.1
        });
        const tower = new THREE.Mesh(towerGeometry, towerMaterial);
        tower.position.y = 6;
        tower.castShadow = true;
        tower.receiveShadow = true;
        group.add(tower);
        
        // Battlements
        for (let i = 0; i < 8; i++) {
            const battlementGeometry = new THREE.BoxGeometry(0.5, 1, 0.8);
            const battlement = new THREE.Mesh(battlementGeometry, towerMaterial);
            battlement.position.set(
                Math.cos((i / 8) * Math.PI * 2) * 2,
                10,
                Math.sin((i / 8) * Math.PI * 2) * 2
            );
            battlement.castShadow = true;
            group.add(battlement);
        }
        
        // Magical roof with team color
        const roofGeometry = new THREE.ConeGeometry(2.8, 3.5, 8);
        const roofMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.25,
            roughness: 0.5,
            metalness: 0.3
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 11.5;
        roof.castShadow = true;
        group.add(roof);
        
        // Magical crystal on top
        const crystalGeometry = new THREE.OctahedronGeometry(0.6);
        const crystalMaterial = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 1,
            transparent: true,
            opacity: 0.9,
            roughness: 0,
            metalness: 0.5
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 14;
        group.add(crystal);
        
        // Inner glow effect
        const glowGeometry = new THREE.SphereGeometry(1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = 14;
        group.add(glow);
        
        // Add magical particles around tower
        const particleRingGeometry = new THREE.TorusGeometry(3, 0.1, 3, 20);
        const particleRingMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2
        });
        const particleRing = new THREE.Mesh(particleRingGeometry, particleRingMaterial);
        particleRing.position.y = 8;
        particleRing.rotation.x = Math.PI / 2;
        group.add(particleRing);
        
        // Tower flag
        const flagPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
        const flagPoleMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3c28 });
        const flagPole = new THREE.Mesh(flagPoleGeometry, flagPoleMaterial);
        flagPole.position.set(0, 15, 0);
        group.add(flagPole);
        
        const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
        const flagMaterial = new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(0.75, 16, 0);
        group.add(flag);
        
        group.position.set(x, -10, z);
        group.userData = { team, crystal, glow, particleRing, flag };
        
        return group;
    }
    
    // Create blue team towers with increased spacing
    const blueTower1 = createTower(-20, 8, 0x4444ff, 'blue');
    scene.add(blueTower1);
    towers.push(blueTower1);
    
    const blueTower2 = createTower(-20, -8, 0x4444ff, 'blue');
    scene.add(blueTower2);
    towers.push(blueTower2);
    
    const blueKing = createTower(-22, 0, 0x6666ff, 'blue');
    blueKing.scale.set(1.3, 1.3, 1.3);
    scene.add(blueKing);
    towers.push(blueKing);
    
    // Create red team towers with increased spacing
    const redTower1 = createTower(20, 8, 0xff4444, 'red');
    scene.add(redTower1);
    towers.push(redTower1);
    
    const redTower2 = createTower(20, -8, 0xff4444, 'red');
    scene.add(redTower2);
    towers.push(redTower2);
    
    const redKing = createTower(22, 0, 0xff6666, 'red');
    redKing.scale.set(1.3, 1.3, 1.3);
    scene.add(redKing);
    towers.push(redKing);
}

function addDecorations() {
    // Create stone pillars and monoliths
    function createStonePillar(x, y, z, type = 'tall') {
        const group = new THREE.Group();
        
        const stoneMaterial = new THREE.MeshPhongMaterial({
            color: 0x3a3a3a,
            emissive: 0x0a0a0a,
            emissiveIntensity: 0.02,
            roughness: 0.95,
            flatShading: true
        });
        
        if (type === 'tall') {
            // Tall stone pillar
            const pillarGeometry = new THREE.CylinderGeometry(0.4, 0.5, 4 + Math.random() * 2, 6);
            const pillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
            pillar.position.y = 2;
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            group.add(pillar);
            
            // Top piece
            const topGeometry = new THREE.ConeGeometry(0.5, 0.6, 6);
            const top = new THREE.Mesh(topGeometry, stoneMaterial);
            top.position.y = 4 + Math.random();
            top.castShadow = true;
            group.add(top);
        } else if (type === 'wide') {
            // Wide stone formation
            const baseGeometry = new THREE.CylinderGeometry(1, 1.2, 2.5, 8);
            const base = new THREE.Mesh(baseGeometry, stoneMaterial);
            base.position.y = 1.25;
            base.castShadow = true;
            base.receiveShadow = true;
            group.add(base);
            
            // Add jagged top
            for (let i = 0; i < 3; i++) {
                const rockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2);
                const rock = new THREE.Mesh(rockGeometry, stoneMaterial);
                rock.position.set(
                    (Math.random() - 0.5) * 0.6,
                    2.5 + Math.random() * 0.4,
                    (Math.random() - 0.5) * 0.6
                );
                rock.castShadow = true;
                group.add(rock);
            }
        } else if (type === 'broken') {
            // Broken pillar
            const brokenGeometry = new THREE.CylinderGeometry(0.5, 0.6, 1.5, 6);
            const broken = new THREE.Mesh(brokenGeometry, stoneMaterial);
            broken.position.y = 0.75;
            broken.rotation.z = 0.2;
            broken.castShadow = true;
            group.add(broken);
        }
        
        group.position.set(x, y, z);
        group.rotation.y = Math.random() * Math.PI * 2;
        return group;
    }
    
    // Create dark bushes
    function createBush(x, y, z) {
        const group = new THREE.Group();
        const bushMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(0.3, 0.4, 0.2),
            roughness: 0.95
        });
        
        for (let i = 0; i < 3; i++) {
            const bushGeometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.3, 6, 5);
            const bush = new THREE.Mesh(bushGeometry, bushMaterial);
            bush.position.set(
                Math.random() * 0.8 - 0.4,
                0.5,
                Math.random() * 0.8 - 0.4
            );
            bush.castShadow = true;
            group.add(bush);
        }
        
        group.position.set(x, y, z);
        return group;
    }
    
    // Create flowers
    function createFlower(x, y, z, color) {
        const group = new THREE.Group();
        
        // Stem
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
        const stemMaterial = new THREE.MeshPhongMaterial({ color: 0x1d3a1d });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.25;
        group.add(stem);
        
        // Dark flower petals
        const petalGeometry = new THREE.CircleGeometry(0.15, 6);
        const petalMaterial = new THREE.MeshPhongMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.05,
            side: THREE.DoubleSide 
        });
        
        for (let i = 0; i < 5; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            petal.position.set(
                Math.cos((i / 5) * Math.PI * 2) * 0.1,
                0.5,
                Math.sin((i / 5) * Math.PI * 2) * 0.1
            );
            petal.lookAt(new THREE.Vector3(0, 0.5, 0));
            group.add(petal);
        }
        
        // Dark center
        const centerGeometry = new THREE.SphereGeometry(0.05);
        const centerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x3a3a20,
            emissive: 0x2a2a10,
            emissiveIntensity: 0.1
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        center.position.y = 0.5;
        group.add(center);
        
        group.position.set(x, y, z);
        group.scale.set(1.5, 1.5, 1.5);
        return group;
    }
    
    // Add stone pillars around the arena
    const pillarPositions = [
        // Behind blue towers
        [-25, -10, 10, 'tall'], [-25, -10, -10, 'tall'], [-27, -10, 0, 'wide'],
        [-23, -10, 13, 'broken'], [-23, -10, -13, 'tall'],
        // Behind red towers  
        [25, -10, 10, 'tall'], [25, -10, -10, 'tall'], [27, -10, 0, 'wide'],
        [23, -10, 13, 'broken'], [23, -10, -13, 'tall'],
        // Sides
        [-15, -10, 15, 'wide'], [15, -10, 15, 'wide'],
        [-15, -10, -15, 'wide'], [15, -10, -15, 'wide'],
        // Scattered pillars
        [-18, -10, 14, 'tall'], [18, -10, 14, 'tall'],
        [-18, -10, -14, 'broken'], [18, -10, -14, 'broken'],
        [-10, -10, 13, 'tall'], [10, -10, 13, 'tall'],
        [-10, -10, -13, 'tall'], [10, -10, -13, 'tall']
    ];
    
    pillarPositions.forEach(pos => {
        const pillar = createStonePillar(pos[0], pos[1], pos[2], pos[3]);
        scene.add(pillar);
    });
    
    // Add rocks
    const rockGeometry = new THREE.DodecahedronGeometry(0.5);
    const rockMaterial = new THREE.MeshPhongMaterial({
        color: 0x696969,
        roughness: 0.9,
        flatShading: true
    });
    
    for (let i = 0; i < 10; i++) {
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(
            (Math.random() - 0.5) * 35,
            -9.8,
            (Math.random() - 0.5) * 25
        );
        rock.scale.set(
            0.5 + Math.random(),
            0.5 + Math.random() * 0.5,
            0.5 + Math.random()
        );
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        rock.castShadow = true;
        scene.add(rock);
    }
}

