const canvas = document.getElementById("renderCanvas");
        const engine = new BABYLON.Engine(canvas, true);

        const createScene = async function () {
            const scene = new BABYLON.Scene(engine);

            /* CAMERA */
            const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
            camera.attachControl(canvas, true);

            /* LIGHTING */
            const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 0.7;

            /* GROUND */
            // No need for ground in AR if using passthrough mode.

            /* SKY */
            // No need for skybox in AR.

            /* MESHES */
            const box = BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}, scene);
            const boxMat = new BABYLON.StandardMaterial("boxMat");
            boxMat.diffuseColor = new BABYLON.Color3(1, 0.6, 0);
            box.material = boxMat;
            box.position.y = 0.5;
            box.position.z = 1.5;

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
            const xr = await scene.createDefaultXRExperienceAsync({
                uiOptions: {
                    sessionMode: "immersive-ar",
                    referenceSpaceType: "local-floor"
                }
            });

            /* INTERACTIONS */
            box.actionManager = new BABYLON.ActionManager(scene);
            box.actionManager.registerAction(new BABYLON.InterpolateValueAction(
                BABYLON.ActionManager.OnPointerOverTrigger,
                box,
                "scaling",
                new BABYLON.Vector3(1.2, 1.2, 1.2),
                250
            ));

            box.actionManager.registerAction(new BABYLON.InterpolateValueAction(
                BABYLON.ActionManager.OnPointerOutTrigger,
                box,
                "scaling",
                new BABYLON.Vector3(1, 1, 1),
                250
            ));

            box.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                changeBoxColor
            ));

            function changeBoxColor() {
                box.material.diffuseColor = BABYLON.Color3.Random();
            }

            // Making the can draggable
            can.bakeCurrentTransformIntoVertices().addBehavior(new BABYLON.SixDofDragBehavior());

            return scene;
        };

        createScene().then((sceneToRender) => {
            engine.runRenderLoop(() => sceneToRender.render());
        });

        window.addEventListener("resize", function() {
          engine.resize();
        });

        engine.runRenderLoop(() => {
            scene.render();
        });
        