

"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function PlatigoScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mountEl = mountRef.current;
    if (!mountEl) return;

    const mount = mountEl;

    // =====================================================
    // CORE SCENE
    // =====================================================

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      48,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );

    camera.position.set(0, 1.4, 12);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setSize(
      mount.clientWidth,
      mount.clientHeight
    );

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    mount.appendChild(renderer.domElement);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // =====================================================
    // OUTLINED OBJECT HELPER
    // =====================================================

    function outlined(
      geometry: THREE.BufferGeometry,
      position: [number, number, number] = [0, 0, 0],
      rotation: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1],
      parent: THREE.Object3D = rootGroup
    ) {
      const fill = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0x000000,
        })
      );

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 20),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
        })
      );

      const group = new THREE.Group();

      group.add(fill);
      group.add(edges);

      group.position.set(
        position[0],
        position[1],
        position[2]
      );

      group.rotation.set(
        rotation[0],
        rotation[1],
        rotation[2]
      );

      group.scale.set(
        scale[0],
        scale[1],
        scale[2]
      );

      parent.add(group);

      return group;
    }

    // =====================================================
    // GROUND
    // =====================================================

    const GROUND_Y = -2.6;

    const grid = new THREE.GridHelper(
      16,
      20,
      0x555555,
      0x333333
    );

    grid.position.set(
      -1.5,
      GROUND_Y,
      0
    );

    scene.add(grid);

    // =====================================================
    // TERMINAL / PC
    // =====================================================

    const TERM_X = 3.4;

    const terminalGroup =
      new THREE.Group();

    terminalGroup.position.set(
      TERM_X,
      -0.5,
      0
    );

    rootGroup.add(terminalGroup);

    outlined(
      new THREE.BoxGeometry(
        4.2,
        2.9,
        0.2
      ),
      [0, 0, 0],
      [0, 0, 0],
      [1, 1, 1],
      terminalGroup
    );

    outlined(
      new THREE.BoxGeometry(
        0.5,
        0.45,
        0.2
      ),
      [0, -1.78, 0],
      [0, 0, 0],
      [1, 1, 1],
      terminalGroup
    );

    outlined(
      new THREE.BoxGeometry(
        1.9,
        0.18,
        0.55
      ),
      [0, -2.05, 0],
      [0, 0, 0],
      [1, 1, 1],
      terminalGroup
    );

    // =====================================================
    // SCREEN
    // =====================================================

    const screenCanvas =
      document.createElement("canvas");

    screenCanvas.width = 512;
    screenCanvas.height = 320;

    const ctx =
      screenCanvas.getContext(
        "2d"
      ) as CanvasRenderingContext2D;

    const screenTexture =
      new THREE.CanvasTexture(
        screenCanvas
      );

    const screenMesh =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          3.85,
          2.55
        ),
        new THREE.MeshBasicMaterial({
          map: screenTexture,
        })
      );

    screenMesh.position.set(
      0,
      0.05,
      0.11
    );

    terminalGroup.add(
      screenMesh
    );

    const screenEdge =
      new THREE.LineSegments(
        new THREE.EdgesGeometry(
          new THREE.PlaneGeometry(
            3.85,
            2.55
          )
        ),
        new THREE.LineBasicMaterial({
          color: 0xffffff,
        })
      );

    screenEdge.position.copy(
      screenMesh.position
    );

    terminalGroup.add(
      screenEdge
    );

    // =====================================================
    // BROWSER AGENT
    // =====================================================

    const agentSteps = [
      {
        log: "agent@platigo:~$ launch browser",
        duration: 900,
        phase: "launch",
      },
      {
        log: "[chromium] opening https://google.com",
        duration: 1700,
        phase: "url",
      },
      {
        log: 'agent@platigo:~$ search "best duck ai"',
        duration: 1500,
        phase: "results",
      },
      {
        log: "> clicking result #1",
        duration: 1000,
        phase: "click",
      },
      {
        log: "> reading page...",
        duration: 1100,
        phase: "read",
      },
      {
        log: "> extracting data...",
        duration: 900,
        phase: "extract",
      },
      {
        log: "agent@platigo:~$ done ✓",
        duration: 1100,
        phase: "done",
      },
    ];

    const fullUrl =
      "google.com/search?q=best+duck+ai";

    let stepIndex = 0;
    let stepElapsed = 0;

    let logDisplayed: string[] = [];

    function drawAgentScreen() {
      const W = screenCanvas.width;
      const H = screenCanvas.height;

      ctx.fillStyle = "#000000";
      ctx.fillRect(
        0,
        0,
        W,
        H
      );

      const step =
        agentSteps[stepIndex];

      const t = Math.min(
        1,
        stepElapsed /
          step.duration
      );

      // Browser dots
      ctx.fillStyle = "#ffffff";

      [22, 40, 58].forEach(
        (x) => {
          ctx.beginPath();

          ctx.arc(
            x,
            20,
            5,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }
      );

      // URL bar
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;

      ctx.strokeRect(
        80,
        10,
        W - 100,
        22
      );

      let urlText = "";

      if (step.phase === "launch") {
        urlText = "";
      } else if (
        step.phase === "url"
      ) {
        const n = Math.floor(
          t * fullUrl.length
        );

        urlText =
          fullUrl.slice(
            0,
            n
          );
      } else {
        urlText = fullUrl;
      }

      ctx.font =
        "13px monospace";

      ctx.fillStyle =
        "#ffffff";

      ctx.fillText(
        urlText,
        88,
        26
      );

      // Divider
      ctx.beginPath();

      ctx.moveTo(0, 42);
      ctx.lineTo(W, 42);

      ctx.stroke();

      // Results
      const resultCount =
        step.phase ===
          "launch" ||
        step.phase === "url"
          ? 0
          : Math.min(
              4,
              Math.ceil(
                t * 4
              ) +
                (stepIndex > 2
                  ? 4
                  : 0)
            );

      const barY = 58;
      const barGap = 26;

      for (
        let i = 0;
        i <
        Math.min(
          resultCount,
          4
        );
        i++
      ) {
        const y =
          barY +
          i * barGap;

        const clicked =
          step.phase ===
            "click" &&
          i === 0;

        ctx.fillStyle =
          clicked &&
          t > 0.4
            ? "#ffffff"
            : "#000000";

        ctx.strokeStyle =
          "#ffffff";

        ctx.lineWidth = 1;

        const w =
          220 -
          i * 18;

        ctx.strokeRect(
          20,
          y,
          w,
          14
        );

        if (
          clicked &&
          t > 0.4
        ) {
          ctx.fillRect(
            20,
            y,
            w,
            14
          );
        }
      }

      // Cursor click
      if (
        step.phase ===
        "click"
      ) {
        const cx =
          20 +
          Math.min(
            1,
            t / 0.4
          ) *
            40;

        const cy =
          barY + 7;

        ctx.strokeStyle =
          "#ffffff";

        ctx.beginPath();

        ctx.moveTo(
          cx,
          cy - 6
        );

        ctx.lineTo(
          cx,
          cy + 6
        );

        ctx.moveTo(
          cx - 6,
          cy
        );

        ctx.lineTo(
          cx + 6,
          cy
        );

        ctx.stroke();

        if (t > 0.4) {
          const rippleT =
            (t - 0.4) /
            0.6;

          ctx.beginPath();

          ctx.arc(
            cx,
            cy,
            4 +
              rippleT *
                14,
            0,
            Math.PI * 2
          );

          ctx.globalAlpha =
            1 - rippleT;

          ctx.stroke();

          ctx.globalAlpha =
            1;
        }
      }

      // Page content
      if (
        step.phase ===
          "read" ||
        step.phase ===
          "extract" ||
        step.phase ===
          "done"
      ) {
        for (
          let i = 0;
          i < 5;
          i++
        ) {
          const y =
            60 +
            i * 14;

          const w =
            240 -
            (i % 3) *
              30;

          ctx.strokeStyle =
            "#666666";

          ctx.strokeRect(
            20,
            y,
            w,
            8
          );
        }
      }

      if (
        step.phase ===
          "extract" ||
        step.phase ===
          "done"
      ) {
        ctx.strokeStyle =
          "#ffffff";

        ctx.strokeRect(
          280,
          55,
          60,
          60
        );

        ctx.font =
          "10px monospace";

        ctx.fillStyle =
          "#ffffff";

        ctx.fillText(
          "DATA",
          292,
          90
        );
      }

      if (
        step.phase ===
        "done"
      ) {
        ctx.font =
          "26px monospace";

        ctx.fillStyle =
          "#ffffff";

        ctx.fillText(
          "✓",
          300,
          100
        );
      }

      // Log divider
      ctx.strokeStyle =
        "#ffffff";

      ctx.beginPath();

      ctx.moveTo(
        0,
        195
      );

      ctx.lineTo(
        W,
        195
      );

      ctx.stroke();

      // Logs
      ctx.font =
        "13px monospace";

      ctx.fillStyle =
        "#ffffff";

      let y = 215;

      logDisplayed.forEach(
        (line) => {
          ctx.fillText(
            line,
            14,
            y
          );

          y += 19;
        }
      );

      const charsToShow =
        Math.floor(
          (stepElapsed /
            step.duration) *
            step.log.length
        );

      const cursorOn =
        Math.floor(
          stepElapsed /
            400
        ) %
          2 ===
        0;

      ctx.fillText(
        step.log.slice(
          0,
          charsToShow
        ) +
          (cursorOn
            ? "▌"
            : ""),
        14,
        y
      );

      screenTexture.needsUpdate =
        true;
    }

    function updateAgent(
      deltaMs: number
    ) {
      stepElapsed += deltaMs;

      const step =
        agentSteps[
          stepIndex
        ];

      if (
        stepElapsed >=
        step.duration
      ) {
        logDisplayed.push(
          step.log
        );

        if (
          logDisplayed.length >
          5
        ) {
          logDisplayed.shift();
        }

        stepIndex =
          (stepIndex + 1) %
          agentSteps.length;

        stepElapsed = 0;

        if (
          stepIndex === 0
        ) {
          logDisplayed =
            [];
        }
      }

      drawAgentScreen();
    }

    // =====================================================
    // PLATYPUS
    // =====================================================

    const platyWalk =
      new THREE.Group();

    rootGroup.add(
      platyWalk
    );

    // Body
    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [0, 0.55, 0],
      [0, 0, 0],
      [1.7, 0.65, 0.9],
      platyWalk
    );

    // Head
    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [1.1, 0.7, 0],
      [0, 0, 0],
      [0.65, 0.55, 0.65],
      platyWalk
    );

    // Bill
    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [1.68, 0.52, 0],
      [0, 0, 0],
      [0.7, 0.16, 0.5],
      platyWalk
    );

    // Tail
    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [-1.05, 0.5, 0],
      [0, 0, 0.12],
      [0.95, 0.16, 0.8],
      platyWalk
    );

    // =====================================================
    // SQUARE EYES
    // =====================================================

    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [1.32, 0.88, 0.2],
      [0, 0, 0],
      [0.12, 0.12, 0.12],
      platyWalk
    );

    outlined(
      new THREE.BoxGeometry(
        1,
        1,
        1
      ),
      [1.32, 0.88, -0.2],
      [0, 0, 0],
      [0.12, 0.12, 0.12],
      platyWalk
    );

    // =====================================================
    // MOUTH
    // =====================================================

    const mouthPoints = [
      new THREE.Vector3(
        1.98,
        0.52,
        -0.26
      ),
      new THREE.Vector3(
        2.05,
        0.45,
        -0.26
      ),
      new THREE.Vector3(
        1.98,
        0.40,
        -0.26
      ),
    ];

    const mouthGeometry =
      new THREE.BufferGeometry().setFromPoints(
        mouthPoints
      );

    const mouth =
      new THREE.Line(
        mouthGeometry,
        new THREE.LineBasicMaterial({
          color: 0xffffff,
        })
      );

    platyWalk.add(
      mouth
    );

    // =====================================================
    // LEGS
    // =====================================================

    function makeLeg(
      hipX: number,
      hipZ: number
    ) {
      const hip =
        new THREE.Group();

      hip.position.set(
        hipX,
        0.55,
        hipZ
      );

      const points = [
        new THREE.Vector3(
          0,
          0,
          0
        ),
        new THREE.Vector3(
          0,
          -0.55,
          0
        ),
      ];

      const legGeo =
        new THREE.BufferGeometry().setFromPoints(
          points
        );

      const leg =
        new THREE.Line(
          legGeo,
          new THREE.LineBasicMaterial({
            color: 0xffffff,
          })
        );

      hip.add(leg);
      platyWalk.add(hip);

      return hip;
    }

    const legFL =
      makeLeg(
        0.75,
        0.42
      );

    const legFR =
      makeLeg(
        0.75,
        -0.42
      );

    const legBL =
      makeLeg(
        -0.75,
        0.42
      );

    const legBR =
      makeLeg(
        -0.75,
        -0.42
      );

    // =====================================================
    // PLAYER STATE
    // =====================================================

    const bounds = {
      minX: -6.2,
      maxX: 1.6,
      minZ: -1.3,
      maxZ: 2.2,
    };

    let currentX = -2;
    let currentZ = 0.4;

    let gaitPhase = 0;

    let jumpVelocity = 0;

    let playerGrounded =
      true;

    // =====================================================
    // KEYBOARD CONTROLS
    // =====================================================

    const keys: Record<
      string,
      boolean
    > = {};

    let lastInputTime =
      performance.now();

    let idleTime = 0;

    let autoMoveTimer = 0;

    let autoMoveX = 0;

    let autoMoveZ = 0;

    function onKeyDown(
      e: KeyboardEvent
    ) {
      const key =
        e.key.toLowerCase();

      if (
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
        ].includes(key)
      ) {
        e.preventDefault();
      }

      keys[key] = true;

      lastInputTime =
        performance.now();

      idleTime = 0;
    }

    function onKeyUp(
      e: KeyboardEvent
    ) {
      keys[
        e.key.toLowerCase()
      ] = false;

      lastInputTime =
        performance.now();

      idleTime = 0;
    }

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    window.addEventListener(
      "keyup",
      onKeyUp
    );

    // =====================================================
    // PLATYPUS UPDATE
    // =====================================================

    function updatePlatypus(
      dt: number
    ) {
      const moveSpeed =
        3.2;

      const gravity =
        12;

      const jumpPower =
        5.2;

      let moveX = 0;
      let moveZ = 0;

      // -------------------------------------------------
      // ARROW KEY MOVEMENT
      // -------------------------------------------------

      if (
        keys["arrowleft"]
      ) {
        moveX -= 1;
      }

      if (
        keys["arrowright"]
      ) {
        moveX += 1;
      }

      if (
        keys["arrowup"]
      ) {
        moveZ -= 1;
      }

      if (
        keys["arrowdown"]
      ) {
        moveZ += 1;
      }

      const manualMoving =
        moveX !== 0 ||
        moveZ !== 0;

      // -------------------------------------------------
      // IDLE TIMER
      // -------------------------------------------------

      if (
        manualMoving ||
        keys[" "]
      ) {
        idleTime = 0;
      } else {
        idleTime += dt;
      }

      // -------------------------------------------------
      // RANDOM AUTONOMOUS MODE
      // AFTER 10 SECONDS
      // -------------------------------------------------

      const autoMode =
        idleTime >= 10;

      if (
        autoMode &&
        !manualMoving
      ) {
        autoMoveTimer -=
          dt;

        if (
          autoMoveTimer <= 0
        ) {
          const angle =
            Math.random() *
            Math.PI *
            2;

          autoMoveX =
            Math.cos(angle);

          autoMoveZ =
            Math.sin(angle);

          autoMoveTimer =
            1.5 +
            Math.random() *
              2.5;

          // Random jump sometimes.
          if (
            Math.random() <
              0.18 &&
            playerGrounded
          ) {
            jumpVelocity =
              jumpPower;

            playerGrounded =
              false;
          }
        }

        moveX =
          autoMoveX;

        moveZ =
          autoMoveZ;
      }

      const moving =
        moveX !== 0 ||
        moveZ !== 0;

      // -------------------------------------------------
      // MOVEMENT
      // -------------------------------------------------

      if (moving) {
        const length =
          Math.sqrt(
            moveX *
              moveX +
              moveZ *
                moveZ
          );

        if (length > 0) {
          moveX /= length;
          moveZ /= length;
        }

        currentX +=
          moveX *
          moveSpeed *
          dt;

        currentZ +=
          moveZ *
          moveSpeed *
          dt;

        currentX =
          THREE.MathUtils.clamp(
            currentX,
            bounds.minX,
            bounds.maxX
          );

        currentZ =
          THREE.MathUtils.clamp(
            currentZ,
            bounds.minZ,
            bounds.maxZ
          );

        // Face left/right.
        if (
          Math.abs(moveX) >
          0.05
        ) {
          platyWalk.scale.x =
            moveX < 0
              ? -1
              : 1;
        }

        gaitPhase +=
          dt * 9;
      }

      // -------------------------------------------------
      // SPACEBAR = JUMP
      // -------------------------------------------------

      if (
        keys[" "] &&
        playerGrounded
      ) {
        jumpVelocity =
          jumpPower;

        playerGrounded =
          false;

        // One jump per press.
        keys[" "] = false;
      }

      // -------------------------------------------------
      // GRAVITY
      // -------------------------------------------------

      if (
        !playerGrounded
      ) {
        jumpVelocity -=
          gravity * dt;

        platyWalk.position.y +=
          jumpVelocity * dt;

        if (
          platyWalk.position.y <=
          GROUND_Y
        ) {
          platyWalk.position.y =
            GROUND_Y;

          jumpVelocity = 0;

          playerGrounded =
            true;
        }
      } else {
        platyWalk.position.y =
          GROUND_Y;
      }

      platyWalk.position.x =
        currentX;

      platyWalk.position.z =
        currentZ;

      // -------------------------------------------------
      // WALKING BOUNCE
      // -------------------------------------------------

      if (
        moving &&
        playerGrounded
      ) {
        platyWalk.position.y =
          GROUND_Y +
          Math.abs(
            Math.sin(
              gaitPhase * 2
            )
          ) *
            0.08;
      }

      // -------------------------------------------------
      // LEG ANIMATION
      // -------------------------------------------------

      const swing =
        moving &&
        playerGrounded
          ? 0.55
          : 0;

      const rest =
        0.15;

      legFL.rotation.x =
        rest +
        Math.sin(
          gaitPhase
        ) *
          swing;

      legBR.rotation.x =
        rest +
        Math.sin(
          gaitPhase
        ) *
          swing;

      legFR.rotation.x =
        rest +
        Math.sin(
          gaitPhase +
            Math.PI
        ) *
          swing;

      legBL.rotation.x =
        rest +
        Math.sin(
          gaitPhase +
            Math.PI
        ) *
          swing;
    }

    // =====================================================
    // FALLING STARS
    // =====================================================

    function makeStarTexture() {
      const s = 64;

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = s;
      canvas.height = s;

      const c =
        canvas.getContext(
          "2d"
        ) as CanvasRenderingContext2D;

      c.translate(
        s / 2,
        s / 2
      );

      c.fillStyle =
        "#ffffff";

      c.beginPath();

      const spikes = 4;

      const outerR =
        s / 2 - 4;

      const innerR =
        outerR * 0.28;

      for (
        let i = 0;
        i <
        spikes * 2;
        i++
      ) {
        const r =
          i % 2 === 0
            ? outerR
            : innerR;

        const a =
          (Math.PI /
            spikes) *
            i -
          Math.PI / 2;

        c.lineTo(
          Math.cos(a) *
            r,
          Math.sin(a) *
            r
        );
      }

      c.closePath();
      c.fill();

      return new THREE.CanvasTexture(
        canvas
      );
    }

    const starTex =
      makeStarTexture();

    const STAR_COUNT =
      240;

    const starGeo =
      new THREE.BufferGeometry();

    const positions =
      new Float32Array(
        STAR_COUNT * 3
      );

    const speeds =
      new Float32Array(
        STAR_COUNT
      );

    const starBounds = {
      x: 16,
      yTop: 10,
      yBottom: -8,
      z: 10,
    };

    for (
      let i = 0;
      i < STAR_COUNT;
      i++
    ) {
      positions[
        i * 3
      ] =
        (Math.random() -
          0.5) *
        starBounds.x *
        2;

      positions[
        i * 3 + 1
      ] =
        Math.random() *
          (starBounds.yTop -
            starBounds.yBottom) +
        starBounds.yBottom;

      positions[
        i * 3 + 2
      ] =
        (Math.random() -
          0.5) *
          starBounds.z *
          2 -
        2;

      speeds[i] =
        0.4 +
        Math.random() *
          1.1;
    }

    starGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    const starMat =
      new THREE.PointsMaterial({
        size: 0.22,
        map: starTex,
        transparent: true,
        depthWrite: false,
        color: 0xffffff,
        sizeAttenuation: true,
      });

    const stars =
      new THREE.Points(
        starGeo,
        starMat
      );

    scene.add(stars);

    // =====================================================
    // DASHED ORBIT RING
    // =====================================================

    const ringPts =
      new THREE.EllipseCurve(
        0,
        0,
        6.5,
        3,
        0,
        Math.PI * 2,
        false,
        0
      )
        .getPoints(120)
        .map(
          (p) =>
            new THREE.Vector3(
              p.x,
              p.y,
              0
            )
        );

    const ringGeo =
      new THREE.BufferGeometry().setFromPoints(
        ringPts
      );

    const ringMat =
      new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 0.18,
        gapSize: 0.14,
        transparent: true,
        opacity: 0.4,
      });

    const ringLine =
      new THREE.Line(
        ringGeo,
        ringMat
      );

    ringLine.computeLineDistances();

    ringLine.rotation.set(
      Math.PI / 2 - 0.25,
      0.1,
      0.4
    );

    ringLine.position.set(
      0.5,
      0.3,
      0
    );

    scene.add(ringLine);

    // =====================================================
    // MOUSE
    // =====================================================

    let mouseX = 0;
    let mouseY = 0;

    function onMouseMove(
      e: MouseEvent
    ) {
      const rect =
        mount.getBoundingClientRect();

      mouseX =
        ((e.clientX -
          rect.left) /
          rect.width -
          0.5) *
        2;

      mouseY =
        ((e.clientY -
          rect.top) /
          rect.height -
          0.5) *
        2;
    }

    mount.addEventListener(
      "mousemove",
      onMouseMove
    );

    // =====================================================
    // RESIZE
    // =====================================================

    function handleResize() {
      const w =
        mount.clientWidth;

      const h =
        mount.clientHeight;

      if (!w || !h) return;

      camera.aspect =
        w / h;

      camera.updateProjectionMatrix();

      renderer.setSize(
        w,
        h
      );
    }

    const ro =
      new ResizeObserver(
        handleResize
      );

    ro.observe(mount);

    // =====================================================
    // ANIMATION
    // =====================================================

    const clock =
      new THREE.Clock();

    let animId = 0;

    function animate() {
      animId =
        requestAnimationFrame(
          animate
        );

      const dt =
        Math.min(
          0.05,
          clock.getDelta()
        );

      const elapsed =
        clock.getElapsedTime();

      updateAgent(
        dt * 1000
      );

      updatePlatypus(
        dt
      );

      // Camera movement
      const angle =
        elapsed * 0.1;

      const radius = 12;

      camera.position.x =
        Math.sin(angle) *
          radius *
          0.4 +
        mouseX * 0.6;

      camera.position.z =
        radius * 0.9;

      camera.position.y =
        1.4 +
        mouseY * 0.4;

      camera.lookAt(
        0.4,
        -0.6,
        0
      );

      // Falling stars
      const pos =
        starGeo.attributes
          .position
          .array as Float32Array;

      for (
        let i = 0;
        i < STAR_COUNT;
        i++
      ) {
        pos[
          i * 3 + 1
        ] -=
          speeds[i] *
          dt;

        if (
          pos[
            i * 3 + 1
          ] <
          starBounds.yBottom
        ) {
          pos[
            i * 3 + 1
          ] =
            starBounds.yTop;

          pos[i * 3] =
            (Math.random() -
              0.5) *
            starBounds.x *
            2;

          pos[
            i * 3 + 2
          ] =
            (Math.random() -
              0.5) *
              starBounds.z *
              2 -
            2;
        }
      }

      starGeo.attributes.position.needsUpdate =
        true;

      ringLine.rotation.z +=
        0.0012;

      renderer.render(
        scene,
        camera
      );
    }

    animate();

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      cancelAnimationFrame(
        animId
      );

      ro.disconnect();

      mount.removeEventListener(
        "mousemove",
        onMouseMove
      );

      window.removeEventListener(
        "keydown",
        onKeyDown
      );

      window.removeEventListener(
        "keyup",
        onKeyUp
      );

      scene.traverse(
        (obj) => {
          const mesh =
            obj as
              | THREE.Mesh
              | THREE.Line
              | THREE.Points;

          if (
            (
              mesh as THREE.Mesh
            ).geometry
          ) {
            (
              mesh as THREE.Mesh
            ).geometry.dispose();
          }

          const material =
            (
              mesh as THREE.Mesh
            ).material;

          if (material) {
            if (
              Array.isArray(
                material
              )
            ) {
              material.forEach(
                (m) =>
                  m.dispose()
              );
            } else {
              material.dispose();
            }
          }
        }
      );

      renderer.dispose();

      if (
        mount.contains(
          renderer.domElement
        )
      ) {
        mount.removeChild(
          renderer.domElement
        );
      }
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        minHeight: "640px",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "12px",
        overflow: "hidden",
        fontFamily: "monospace",
      }}
    >
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "560px",
        }}
      />

      <div
        style={{
          textAlign: "center",
          color: "#ffffff",
          padding:
            "16px 0 24px",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            letterSpacing: "6px",
            fontWeight: 700,
          }}
        >
          PLATIGO
        </div>

        <div
          style={{
            fontSize: "11px",
            letterSpacing: "3px",
            opacity: 0.6,
            marginTop: "4px",
          }}
        >
          illuzzio - Tell It Where to Go,
          Watch It Run the Show....
        </div>

        <div
          style={{
            fontSize: "10px",
            letterSpacing: "2px",
            opacity: 0.45,
            marginTop: "10px",
          }}
        >
          ARROW KEYS MOVE
          &nbsp;&nbsp; • &nbsp;&nbsp;
          SPACE JUMP
        </div>
      </div>
    </div>
  );
}