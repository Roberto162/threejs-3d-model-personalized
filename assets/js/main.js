import * as THREE from 'three';

import Stats from 'three/addons/libs/stats.module.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();

let camera, scene, renderer, stats, object, loader, guiMorphsFolder;
let mixer;

const timer = new THREE.Timer();
timer.connect(document);

const params = {
    asset: 'Samba Dancing'
};

const animationsList = {
    death: './assets/models/fbx/Death_From_Right.fbx',
    entry: './assets/models/fbx/Entry.fbx',
    walk: './assets/models/fbx/Walk_To_Stop.fbx',
    crawl: './assets/models/fbx/Zombie_Crawl.fbx',
    transition: './assets/models/fbx/Zombie_Transition.fbx'
};
const assets = [
    'Zombie_Transition',
    'Entry',
    'Walk_To_Stop',
    'Zombie_Crawl',
    'Death_From_Right',
];


init();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0xa0a0a0, 200, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = - 100;
    dirLight.shadow.camera.left = - 120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    // scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);
    loadModel();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

}

/*function loadAsset(asset) {

    loader.load('./assets/models/fbx/' + asset + '.fbx', function (group) {

        if (object) {

            object.traverse(function (child) {

                if (child.isSkinnedMesh) {

                    child.skeleton.dispose();

                }

                if (child.material) {

                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {

                        if (material.map) material.map.dispose();
                        material.dispose();

                    });

                }

                if (child.geometry) child.geometry.dispose();

            });

            scene.remove(object);

        }

        //

        object = group;

        if (object.animations && object.animations.length) {

            mixer = new THREE.AnimationMixer(object);

            const action = mixer.clipAction(object.animations[0]);
            action.play();

        } else {

            mixer = null;

        }

        guiMorphsFolder.children.forEach((child) => child.destroy());
        guiMorphsFolder.hide();

        object.traverse(function (child) {

            if (child.isMesh) {

                child.castShadow = true;
                child.receiveShadow = true;

                if (child.morphTargetDictionary) {

                    guiMorphsFolder.show();
                    const meshFolder = guiMorphsFolder.addFolder(child.name || child.uuid);
                    Object.keys(child.morphTargetDictionary).forEach((key) => {

                        meshFolder.add(child.morphTargetInfluences, child.morphTargetDictionary[key], 0, 1, 0.01);

                    });

                }

            }

        });

        scene.add(object);

    });

}*/

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    timer.update();

    const delta = timer.getDelta();

    if (mixer) mixer.update(delta);

    renderer.render(scene, camera);

    stats.update();

}
let actions = {};
let activeAction;

function loadModel() {
    loader.load('./assets/models/fbx/Zombie_Transition.fbx', function (fbx) {

        object = fbx;
        mixer = new THREE.AnimationMixer(object);

        scene.add(object);

        loadAnimations();
    });
}

function loadAnimations() {
    const animLoader = new FBXLoader();

    for (let key in animationsList) {

        animLoader.load(animationsList[key], function (anim) {
             if (!mixer) return;

            const clip = anim.animations[0];
            const action = mixer.clipAction(clip);

// 🔥 CONFIGURACIÓN PRO
action.enabled = true;
action.setEffectiveWeight(1);
action.setEffectiveTimeScale(1);

// evita congelamientos raros
action.clampWhenFinished = false;
action.loop = THREE.LoopRepeat;

// 🔥 MUY IMPORTANTE
action.zeroSlopeAtStart = true;
action.zeroSlopeAtEnd = true;


            actions[key] = action;
            if (key === 'entry') {
            activeAction = action;
            action.play();
}

        });
    }
}

function playAnimation(name) {

    const newAction = actions[name];
    if (!newAction || newAction === activeAction) return;

    newAction.enabled = true;

    // 🔥 iniciar sin reiniciar
    newAction.paused = false;

    if (activeAction) {

        // 🔥 sincronización por progreso (no por tiempo directo)
        const oldClip = activeAction.getClip();
        const newClip = newAction.getClip();

        const progress = activeAction.time / oldClip.duration;
        newAction.time = progress * newClip.duration;

        // 🔥 mezcla real
        newAction.crossFadeFrom(activeAction, 1.2, true);

    } else {
        newAction.fadeIn(1.2);
    }

    newAction.play();
    activeAction = newAction;
}

window.addEventListener('keydown', (e) => {

    switch (e.key) {
        case '1': playAnimation('death'); break;
        case '2': playAnimation('entry'); break;
        case '3': playAnimation('walk'); break;
        case '4': playAnimation('crawl'); break;
        case '5': playAnimation('transition'); break;
    }

});