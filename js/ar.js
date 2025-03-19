// Get the canvas element as a const
const canvas = document.getElementById("renderCanvas");

// Create the BABYLON 3D engine, and attach it to the canvas
const engine = new BABYLON.Engine(canvas, true);

// The createScene function
const createScene = async function () {
    // Create a new BABYLON scene, passing in the engine as an argument
    const scene = new BABYLON.Scene(engine);

    /* CAMERA */
    // Add a camera and allow it to control the canvas
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);

    /* LIGHTING */
    // Add lighting to the scene
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    /* MESHES */
    // Create a simple box
    const box = BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}, scene);
    const boxMat = new BABYLON.StandardMaterial("boxMat");
    boxMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0);
    box.material = boxMat;
    box.position.y = 0.5;
    box.position.z = 1.5;

    // Create a cylinder (can)
    const can = BABYLON.MeshBuilder.CreateCylinder("can", {diameter: 0.1, height: 0.3, tessellation: 10}, scene);
    const canMat = new BABYLON.StandardMaterial("canMat");
    canMat.diffuseColor = new BABYLON.Color3(1, 0, 0.6);
    can.material = canMat;
    can.position.x = 0.5;

    /* UI - Text Block */
    const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
    const text = new BABYLON.GUI.TextBlock();
    text.text = "Welcome to MoveXR!";
    text.color = "white";
    text.fontSize = 24;
    text.top = "10px";
    text.left = "10px";
    advancedTexture.addControl(text);  // Add the TextBlock to the UI

    /* ENABLE AR */
    // Start a WebXR session (immersive-ar)
    const xr = await scene.createDefaultXRExperienceAsync({
        uiOptions: {
            sessionMode: "immersive-ar",
            referenceSpaceType: "local-floor" // Ideal for AR
        }
    });

    /* INTERACTIONS */
    // Add interaction to the box mesh
    box.actionManager = new BABYLON.ActionManager(scene);

    box.actionManager.registerAction(
        new BABYLON.InterpolateValueAction(
            BABYLON.ActionManager.OnPointerOverTrigger,
            box,
            "scaling",
            new BABYLON.Vector3(1.2, 1.2, 1.2),
            250
        )
    );

    box.actionManager.registerAction(
        new BABYLON.InterpolateValueAction(
            BABYLON.ActionManager.OnPointerOutTrigger,
            box,
            "scaling",
            new BABYLON.Vector3(1, 1, 1),
            250
        )
    );

    // Change the color of the box on click
    box.actionManager.registerAction(
        new BABYLON.ExecuteCodeAction(
            BABYLON.ActionManager.OnPickTrigger,
            changeBoxColor
        )
    );

    function changeBoxColor() {
        box.material.diffuseColor = BABYLON.Color3.Random();
    }

    // Make the "can" grabbable and moveable
    can.bakeCurrentTransformIntoVertices().addBehavior(new BABYLON.SixDofDragBehavior());

    return scene;
};

// Run the scene
createScene().then((sceneToRender) => {
    engine.runRenderLoop(() => sceneToRender.render());
});

// Resize the canvas when the window size changes
window.addEventListener("resize", function() {
    engine.resize();
});