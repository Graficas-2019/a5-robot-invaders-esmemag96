var renderer = null,
scene = null,
camera = null,
root = null,
group = null,
lol = null,
score = 0,
orbitControls = null;
var flag = 0;
var speed = 0.1;
var robots = [];
loopAnimation = false;
var robot_mixer = {};
var game = true;
gameAlreadyStarted = false;
var start = "";
var startTime = 0;
var deadAnimator;
var morphs = [];
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED, CLICKED;
var duration = 20000; // ms
var currentTime = Date.now();

var animation = "idle";
function initAnimations()
{
    animator = new KF.KeyFrameAnimator;
    animator.init({
        interps:
            [
                {
                    keys:[0, 0.3, 0.6, 1],
                    values:[
                      { x: 0, y : 0, z : 0 },
                      { x:-Math.PI/6, y : Math.PI/7, z : 0 },
                      { x:-Math.PI/6 * 2, y : Math.PI/7 *2, z : 0},
                      { x:-Math.PI/6 * 3, y : Math.PI/7 *3, z : 0 },
                    ],
                },
            ],
        loop: false
    });
}

function changeAnimation(start_text, animation_text){
    animation = animation_text;
    start = start_text;
    if(!gameAlreadyStarted){
        startTime = Date.now();
        gameAlreadyStarted = true;
    }
}
function playAnimations(){
    animator.start();
}

function loadFBX(i, x, z){
    var loader = new THREE.FBXLoader();
    loader.load( 'models/robot_run.fbx', function ( object ){
        object.mixer = new THREE.AnimationMixer( scene );
        var action = object.mixer.clipAction( object.animations[ 0 ], object );
        object.scale.set(0.02, 0.02, 0.02);
        action.play();
        object.traverse( function ( child ) {
            if ( child.isMesh ) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        robots[i] = object;
        robots[i].name = i;
        robots[i].isDead = false;
        robots[i].tOfDeath = 0;
        robots[i].position.set(x, -4, z);
        getNormal(i);
        scene.add(robots[i]);
    } );
}

function getNormal(i){
    robots[i].originalPositionZ = robots[i].position.z;
    robots[i].originalPositionX = robots[i].position.x;
    robots[i].originalPositionY = robots[i].position.y;
    var xN = camera.position.x - robots[i].position.x;
    var yN = camera.position.y - robots[i].position.y;
    var zN = camera.position.z - robots[i].position.z;
    var xNN = xN * xN;
    var yNN = yN * yN;
    var zNN = zN * zN;
    var normal = xNN + yNN + zNN;
    normal = Math.sqrt(normal)
    xN = xN/normal * speed;
    zN = zN/normal * speed;
    robots[i].targetPositionX = xN;
    robots[i].targetPositionZ = zN;
    robots[i].lookAt(camera.position);
}

function createDeadAnimation(robot) {
    tempPos = Math.random() * 100;
    if(Math.random() < 0.50){
        tempPos *= -1;
    }
    robot.position.z = robot.originalPositionZ;
    robot.position.x = tempPos;
    robot.position.y = robot.originalPositionY;
    i = robot.name;
    getNormal(i);
}

function animate() {
    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;
    var time = (now - startTime)/1000
    document.getElementById("time").innerHTML = time +" s";
    document.getElementById("points").innerHTML = "Score: " + score;
    if(start == "start"){
        for(robot of robots){
            robot.mixer.update(deltat * 0.001);
            if(animation == 'run'){
                robot.position.z += robot.targetPositionZ;
                robot.position.x += robot.targetPositionX;
                if(robot.position.z >= camera.position.z){
                    createDeadAnimation(robot)
                    score--;
                }
            }
            if(robot.isDead){
                var seconds2 = (now - robot.tOfDeath)/1000
                if (seconds2 >= 1.3){
                    robot.isDead = false;
                    createDeadAnimation(robot);
                }
            }
        }
    }
    if(time >= 60){
        start = "";
        for (robot of robots){
            robot.position.set(robot.originalPositionX, robot.originalPositionY, robot.originalPositionZ);
        }
        finalScore = score;
        alert("Game Over. Your final score is: " + finalScore);
        time = 0;
        startTime = 0;
        document.getElementById("time").innerHTML = time +" s";
        document.getElementById("points").innerHTML = "score: " + score;
        gameAlreadyStarted = false;
    }
}

function run() {
        // Render the scene
        renderer.render( scene, camera );

        // Spin the cube for next frame
        requestAnimationFrame(function() { run(); });
        if (start == "start"){
            animate();
            KF.update();
        }
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var floorURL = "images/grass.jpg";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );

    camera.position.set(3, 30, 110);
    scene.add(camera);


    // Create a group to hold all the objects
    root = new THREE.Object3D;

    spotLight = new THREE.SpotLight (0xfffff0);
    spotLight.position.set(-150, 8, -10);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 200;
    spotLight.shadow.camera.fov = 45;

    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    for(i = 0; i < 20; i++){
        x = Math.random() * 100;
        if(i < 10){
            loadFBX(i, i * -10, -x);
        }else{
            loadFBX(i, (i-10) * 10, -x);
        }
    }

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(floorURL);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    raycaster = new THREE.Raycaster();

    document.addEventListener( 'mousemove', onDocumentMouseMove );
    document.addEventListener('mousedown', onDocumentMouseDown);
    window.addEventListener( 'resize', onWindowResize);

    // Now add the group to our scene
    scene.add( root );
    initAnimations();
}

function onDocumentMouseMove( event )
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects(robots, true);

    if ( intersects.length > 0 )
    {
        if ( INTERSECTED != intersects[ 0 ].object )
        {
            if ( INTERSECTED )
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xffffff );
        }
    }
    else
    {
        if ( INTERSECTED )
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;
    }

}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
function onDocumentMouseDown(event)
{
    event.preventDefault();
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( robots , true);

    if ( intersects.length > 0 )
    {

        CLICKED = intersects[ 0 ].object;
        for(var i = 0; i<= animator.interps.length -1; i++){
            robots[CLICKED.parent.name].isDead = true;
            robots[CLICKED.parent.name].tOfDeath = Date.now();
            animator.interps[i].target = robots[CLICKED.parent.name].rotation;
            score ++;
        }
        playAnimations();
    }
    else
    {
        if ( CLICKED )
            CLICKED.material.emissive.setHex( CLICKED.currentHex );

        CLICKED = null;
    }
}
