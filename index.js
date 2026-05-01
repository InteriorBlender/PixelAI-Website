document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("js-ready");

  const visual = document.querySelector(".visual");
  const visualArea = document.querySelector(".visual-area");
  const zones = document.querySelectorAll(".material-zone");
  const selectedMaterial = document.querySelector(".selected-material");
  const c = document.querySelector("#c");
  const ctx = c?.getContext("2d");
  const demo = document.querySelector(".material-demo");
  const demoZones = document.querySelectorAll(".demo-material-zone");
  const demoAlbedoPop = document.querySelector(".demo-albedo-pop");
  const aiCard = document.querySelector(".ai-rendering-card");
  const aiComparator = document.querySelector(".ai-comparator");
  const pbrDemo = document.querySelector(".pbr-demo");
  const pbrLight = document.querySelector("#pbr-light");
  const addonShowcase = document.querySelector(".addon-showcase");
  const addonStack = document.querySelector(".addon-stack");
  const addonItems = document.querySelectorAll(".addon-item");
  const addonTabs = document.querySelectorAll(".addon-tab");

  if (!visual || !visualArea || zones.length === 0 || !c || !ctx) {
    return;
  }

  const zoneViewBox = {
    width: 1736,
    height: 906
  };

  const textureBase = "img/Texture";
  const createMaps = (name) => ({
    albedo: `url("${textureBase}/${name}.png")`,
    normal: `url("${textureBase}/${name}_normal.png")`,
    roughness: `url("${textureBase}/${name}_roughness.png")`,
    height: `url("${textureBase}/${name}_height.png")`
  });

  const textureMaps = {
    wood: createMaps("Wood"),
    marble: createMaps("Marble"),
    sofa: createMaps("Sofa"),
    rug: createMaps("Rug"),
    leather: createMaps("Leather"),
    table: createMaps("MarbleTable")
  };

  const clamp = (min, max, value) => Math.min(max, Math.max(min, value));

  const materialPresets = {
    wood: {
      label: "Wood Wall",
      maps: textureMaps.wood
    },
    marble: {
      label: "Marble Slab",
      maps: textureMaps.marble
    },
    sofa: {
      label: "Sofa Fabric",
      maps: textureMaps.sofa
    },
    rug: {
      label: "Floor Rug",
      maps: textureMaps.rug
    },
    leather: {
      label: "Leather Chair",
      maps: textureMaps.leather
    },
    table: {
      label: "Stone Table",
      maps: textureMaps.table
    }
  };

  const demoAutoSequence = [
    { material: "wood", x: 54, y: 26 },
    { material: "marble", x: 64, y: 31 },
    { material: "sofa", x: 68, y: 63 },
    { material: "rug", x: 51, y: 79 },
    { material: "leather", x: 18, y: 67 },
    { material: "table", x: 56, y: 72 }
  ];
  let demoAutoPlaying = true;
  let demoAutoIndex = 0;

  const setMaterial = (materialName) => {
    const preset = materialPresets[materialName] || materialPresets.wood;

    zones.forEach((zone) => {
      zone.classList.toggle("is-active", zone.dataset.material === materialName);
    });

    if (selectedMaterial) {
      selectedMaterial.textContent = preset.label;
    }

    visualArea.style.setProperty("--albedo-map", preset.maps.albedo);
    visualArea.style.setProperty("--normal-map", preset.maps.normal);
    visualArea.style.setProperty("--roughness-map", preset.maps.roughness);
    visualArea.style.setProperty("--height-map", preset.maps.height);

    visualArea.classList.remove("texture-resolving");
    void visualArea.offsetWidth;
    visualArea.classList.add("texture-resolving");

    window.setTimeout(() => {
      visualArea.classList.remove("texture-resolving");
    }, 780);
  };

  zones.forEach((zone) => {
    zone.addEventListener("click", () => setMaterial(zone.dataset.material));
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setMaterial(zone.dataset.material);
      }
    });
  });

  const displayDemoAlbedo = (materialName, x, y) => {
    if (!demo || !demoAlbedoPop) {
      return;
    }

    const preset = materialPresets[materialName] || materialPresets.wood;

    demoAlbedoPop.style.left = `${clamp(9, 91, x)}%`;
    demoAlbedoPop.style.top = `${clamp(14, 86, y)}%`;
    demoAlbedoPop.style.setProperty("--demo-albedo-map", preset.maps.albedo);
    demoAlbedoPop.classList.remove("is-visible", "texture-resolving");
    void demoAlbedoPop.offsetWidth;
    demoAlbedoPop.classList.add("is-visible", "texture-resolving");

    window.setTimeout(() => {
      demoAlbedoPop.classList.remove("texture-resolving");
    }, 780);
  };

  const showDemoAlbedo = (event, materialName) => {
    if (!demo) {
      return;
    }

    const rect = demo.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    demoAutoPlaying = false;
    displayDemoAlbedo(materialName, x, y);
  };

  demoZones.forEach((zone) => {
    zone.addEventListener("click", (event) => {
      showDemoAlbedo(event, zone.dataset.material);
    });
  });

  if (demo && demoAlbedoPop) {
    window.setTimeout(() => {
      const item = demoAutoSequence[0];
      displayDemoAlbedo(item.material, item.x, item.y);
    }, 650);

    window.setInterval(() => {
      if (!demoAutoPlaying) {
        return;
      }

      demoAutoIndex = (demoAutoIndex + 1) % demoAutoSequence.length;
      const item = demoAutoSequence[demoAutoIndex];
      displayDemoAlbedo(item.material, item.x, item.y);
    }, 2200);
  }

  const baseWidth = 2000;
  let cw = baseWidth;
  let ch = baseWidth;
  let cRect = c.getBoundingClientRect();
  let sx = 1;
  let sy = 1;
  let sourceRect = { x: 0, y: 0, width: 2000, height: 2000 };

  const T = Math.PI * 2;
  const m = { x: cw / 2, y: ch / 2, s: 1.5, x2: cw / 2, y2: ch / 2 };
  const hasGsap = Boolean(window.gsap);
  const xTo = hasGsap ? gsap.quickTo(m, "x", { duration: 2, ease: "expo" }) : null;
  const yTo = hasGsap ? gsap.quickTo(m, "y", { duration: 2, ease: "expo" }) : null;
  const sTo = hasGsap ? gsap.quickTo(m, "s", { duration: 2, ease: "power2" }) : null;
  let sDestination = m.s;
  let boxes = [];
  const boxSize = 36;
  const fade = false;

  const img = new Image();
  img.src = "img/interior-design-hero-scanned.png";

  const getCoverSourceRect = () => {
    if (!img.naturalWidth || !img.naturalHeight) {
      return { x: 0, y: 0, width: 2000, height: 2000 };
    }

    const imageRatio = img.naturalWidth / img.naturalHeight;
    const canvasRatio = cw / ch;

    if (imageRatio > canvasRatio) {
      const width = img.naturalHeight * canvasRatio;
      return {
        x: (img.naturalWidth - width) / 2,
        y: 0,
        width,
        height: img.naturalHeight
      };
    }

    const height = img.naturalWidth / canvasRatio;
    return {
      x: 0,
      y: (img.naturalHeight - height) / 2,
      width: img.naturalWidth,
      height
    };
  };

  const buildBoxes = () => {
    boxes = [];

    for (let x = 0; x <= cw; x += boxSize) {
      for (let y = 0; y <= ch; y += boxSize) {
        boxes.push({ x, y, d: 0, s: 0 });
      }
    }
  };

  const resizeCanvas = () => {
    cRect = c.getBoundingClientRect();
    cw = baseWidth;
    ch = Math.round(baseWidth * (cRect.height / cRect.width));
    c.width = cw;
    c.height = ch;
    sx = cw / cRect.width;
    sy = ch / cRect.height;
    sourceRect = getCoverSourceRect();
    buildBoxes();
  };

  const tick = () => {
    if (!hasGsap) {
      m.x += (m.x2 - m.x) * .055;
      m.y += (m.y2 - m.y) * .055;
    }

    const d = Math.hypot(m.x - m.x2, m.y - m.y2);

    if (hasGsap) {
      sTo(d / cw * 2);
    } else {
      sDestination = d / cw * 2;
      m.s += (sDestination - m.s) * .04;
    }

    ctx.clearRect(0, 0, cw, ch);

    boxes.forEach(drawImg);

    if (fade) {
      ctx.globalAlpha = 1;
    }

    boxes.forEach(drawDots);

    if (!hasGsap) {
      requestAnimationFrame(tick);
    }
  };

  function drawImg(box) {
    box.d = Math.hypot(box.x - m.x, box.y - m.y);
    box.s = 1 - clamp(0, 1, box.d / cw / m.s);

    if (box.s < 0.001) {
      return;
    }

    const boxScaled = boxSize * box.s;

    if (fade) {
      ctx.globalAlpha = box.s;
    }

    ctx.drawImage(
      img,
      sourceRect.x + ((box.x + boxScaled / 2) / cw) * sourceRect.width,
      sourceRect.y + ((box.y + boxScaled / 2) / ch) * sourceRect.height,
      ((boxSize - boxScaled) / cw) * sourceRect.width,
      ((boxSize - boxScaled) / ch) * sourceRect.height,
      box.x,
      box.y,
      boxSize,
      boxSize
    );
  }

  function drawDots(box) {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(box.x, box.y, boxSize * 0.15 * box.s, 0, T);
    ctx.fill();
  }

  img.onload = () => {
    resizeCanvas();

    if (hasGsap) {
      gsap.ticker.add(tick);
    } else {
      requestAnimationFrame(tick);
    }
  };

  visual.addEventListener("pointermove", (event) => {
    m.x2 = (event.clientX - cRect.left) * sx;
    m.y2 = (event.clientY - cRect.top) * sy;

    if (hasGsap) {
      xTo(m.x2);
      yTo(m.y2);
    }
  });

  window.addEventListener("resize", () => {
    resizeCanvas();
  });

  const updateAiComparator = () => {
    if (!aiCard || !aiComparator) {
      return;
    }

    const rect = aiCard.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollableDistance = Math.max(1, rect.height - viewportHeight);
    const progress = clamp(0, 1, -rect.top / scrollableDistance);
    const reveal = (value, start, end) => clamp(0, 100, ((value - start) / (end - start)) * 100);
    const first = reveal(progress, .08, .18);
    const second = reveal(progress, .34, .46);
    const third = reveal(progress, .64, .78);

    aiComparator.style.setProperty("--ai-first", `${first}%`);
    aiComparator.style.setProperty("--ai-second", `${second}%`);
    aiComparator.style.setProperty("--ai-third", `${third}%`);
  };

  let aiFrameQueued = false;
  const queueAiUpdate = () => {
    if (aiFrameQueued) {
      return;
    }

    aiFrameQueued = true;
    requestAnimationFrame(() => {
      aiFrameQueued = false;
      updateAiComparator();
    });
  };

  updateAiComparator();
  window.addEventListener("scroll", queueAiUpdate, { passive: true });
  window.addEventListener("resize", queueAiUpdate, { passive: true });

  if (addonShowcase && addonStack && addonItems.length > 0) {
    let activeAddon = Number(addonShowcase.dataset.active) || 0;
    const addonCount = addonItems.length;
    let addonTransitionTimer = null;

    const paintAddonShowcase = (exitingIndex = null, enteringIndex = null) => {
      addonShowcase.dataset.active = String(activeAddon);

      addonItems.forEach((item) => {
        const itemIndex = Number(item.dataset.addonIndex);
        const relativeIndex = (itemIndex - activeAddon + addonCount) % addonCount;

        item.classList.remove("is-active", "is-next", "is-tail", "is-exiting", "is-entering");

        if (itemIndex === exitingIndex) {
          item.classList.add("is-exiting");
          return;
        }

        if (relativeIndex === 0) {
          item.classList.add("is-active");
        } else if (relativeIndex === 1) {
          item.classList.add("is-next");
        } else {
          item.classList.add("is-tail");

          if (itemIndex === enteringIndex) {
            item.classList.add("is-entering");
          }
        }
      });

      addonTabs.forEach((tab) => {
        const isActive = Number(tab.dataset.addonIndex) === activeAddon;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-pressed", String(isActive));
      });
    };

    const setAddonShowcase = (nextIndex) => {
      const previousAddon = activeAddon;
      activeAddon = ((nextIndex % addonCount) + addonCount) % addonCount;

      window.clearTimeout(addonTransitionTimer);

      if (previousAddon === activeAddon) {
        paintAddonShowcase();
        return;
      }

      paintAddonShowcase(previousAddon);

      addonTransitionTimer = window.setTimeout(() => {
        paintAddonShowcase(null, previousAddon);
      }, 820);
    };

    addonTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setAddonShowcase(Number(tab.dataset.addonIndex));
      });
    });

    addonStack.addEventListener("click", () => {
      setAddonShowcase(activeAddon + 1);
    });

    addonStack.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      setAddonShowcase(activeAddon + 1);
    });

    paintAddonShowcase();
  }

  const setPbrLight = (x, y) => {
    if (!pbrLight) {
      return;
    }

    pbrLight.setAttribute("x", x);
    pbrLight.setAttribute("y", y);
  };

  if (pbrDemo && pbrLight) {
    let pbrAnim = 0;
    let pbrAnimating = true;

    const animatePbrLight = () => {
      if (!pbrAnimating) {
        return;
      }

      pbrAnim += .0125;
      setPbrLight(800 + Math.cos(pbrAnim) * 520, 230 + Math.sin(pbrAnim * .8) * 150);
      requestAnimationFrame(animatePbrLight);
    };

    pbrDemo.addEventListener("pointermove", (event) => {
      pbrAnimating = false;
      const rect = pbrDemo.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 1600;
      const y = ((event.clientY - rect.top) / rect.height) * 820;
      setPbrLight(x, y);
    });

    pbrDemo.addEventListener("pointerleave", () => {
      pbrAnimating = true;
      requestAnimationFrame(animatePbrLight);
    });

    requestAnimationFrame(animatePbrLight);
  }

  const particulateCanvas = document.querySelector("#text-material-canvas");
  const particulateWrap = document.querySelector(".particulate-demo");

  if (particulateCanvas && particulateWrap) {
    const pctx = particulateCanvas.getContext("2d", { willReadFrequently: true });
    const particulateLabel = particulateWrap.querySelector(".particulate-label strong");
    const particulateImages = Array.isArray(window.TEXT_MATERIAL_PARTICLE_DATA)
      ? window.TEXT_MATERIAL_PARTICLE_DATA
      : [];
    let particulateWidth = 0;
    let particulateHeight = 0;
    let particulateParticles = [];
    let particulateIndex = 0;

    class TextMaterialParticle {
      constructor(x, y, originX, originY, r, g, b, size) {
        this.x = x;
        this.y = y;
        this.originX = originX;
        this.originY = originY;
        this.r = r;
        this.g = g;
        this.b = b;
        this.size = size;
        this.vx = (originX - x) * .0015 + (Math.random() - .5) * .45;
        this.vy = (originY - y) * .0015 + (Math.random() - .5) * .45;
        this.friction = .965 + Math.random() * .02;
        this.spring = .0017 + Math.random() * .0024;
        this.opacity = 0;
      }

      update() {
        this.opacity += (1 - this.opacity) * .015;
        this.vx += (this.originX - this.x) * this.spring;
        this.vy += (this.originY - this.y) * this.spring;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        pctx.globalAlpha = this.opacity;
        pctx.fillStyle = `rgb(${this.r},${this.g},${this.b})`;
        pctx.beginPath();
        pctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
        pctx.fill();
        pctx.globalAlpha = 1;
      }
    }

    const resizeParticulate = () => {
      const rect = particulateWrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      particulateWidth = Math.max(1, Math.floor(rect.width));
      particulateHeight = Math.max(1, Math.floor(rect.height));
      particulateCanvas.width = Math.floor(particulateWidth * dpr);
      particulateCanvas.height = Math.floor(particulateHeight * dpr);
      particulateCanvas.style.width = `${particulateWidth}px`;
      particulateCanvas.style.height = `${particulateHeight}px`;
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const getParticleBounds = (points, mode) => {
      if (mode !== "text" || points.length === 0) {
        return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
      }

      return points.reduce((bounds, point) => ({
        minX: Math.min(bounds.minX, point[0]),
        minY: Math.min(bounds.minY, point[1]),
        maxX: Math.max(bounds.maxX, point[0]),
        maxY: Math.max(bounds.maxY, point[1])
      }), { minX: 1, minY: 1, maxX: 0, maxY: 0 });
    };

    const shatterTextMaterial = (entry) => {
      resizeParticulate();
      particulateParticles = [];

      const points = entry.points || [];
      const bounds = getParticleBounds(points, entry.mode);
      const rangeX = Math.max(.001, bounds.maxX - bounds.minX);
      const rangeY = Math.max(.001, bounds.maxY - bounds.minY);
      const aspect = entry.mode === "text" ? rangeX / rangeY : entry.aspect || 1;
      const maxW = particulateWidth * (entry.mode === "text" ? .86 : .58);
      const maxH = particulateHeight * (entry.mode === "text" ? .68 : .76);
      let iw = Math.floor(maxW);
      let ih = Math.floor(iw / aspect);

      if (ih > maxH) {
        ih = Math.floor(maxH);
        iw = Math.floor(ih * aspect);
      }

      const ox = Math.floor((particulateWidth - iw) / 2);
      const oy = Math.floor((particulateHeight - ih) / 2);
      const densitySize = Math.sqrt((iw * ih) / Math.max(1, points.length));
      const size = entry.mode === "text"
        ? Math.max(1.6, Math.min(3.4, densitySize * .42))
        : Math.max(1.45, Math.min(4.1, densitySize * .56));

      points.forEach((point) => {
        const normalizedX = entry.mode === "text" ? (point[0] - bounds.minX) / rangeX : point[0];
        const normalizedY = entry.mode === "text" ? (point[1] - bounds.minY) / rangeY : point[1];
        const originX = ox + normalizedX * iw;
        const originY = oy + normalizedY * ih;
        const edge = Math.random();
        let sx = Math.random() * particulateWidth;
        let sy = Math.random() * particulateHeight;

        if (edge < .25) {
          sy = -40;
        } else if (edge < .5) {
          sy = particulateHeight + 40;
        } else if (edge < .75) {
          sx = -40;
        } else {
          sx = particulateWidth + 40;
        }

        particulateParticles.push(new TextMaterialParticle(
          sx,
          sy,
          originX,
          originY,
          point[2],
          point[3],
          point[4],
          size
        ));
      });
    };

    const nextParticulateImage = () => {
      if (particulateImages.length === 0) {
        return;
      }

      const entry = particulateImages[particulateIndex];

      if (particulateLabel) {
        particulateLabel.textContent = entry.label;
      }

      particulateWrap.style.setProperty("--particulate-image", `url("${entry.src}")`);
      shatterTextMaterial(entry);
      particulateIndex = (particulateIndex + 1) % particulateImages.length;
    };

    const renderParticulate = () => {
      pctx.fillStyle = "rgba(0, 0, 0, .28)";
      pctx.fillRect(0, 0, particulateWidth, particulateHeight);

      particulateParticles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(renderParticulate);
    };

    resizeParticulate();
    nextParticulateImage();
    window.setInterval(nextParticulateImage, 8000);
    window.addEventListener("resize", resizeParticulate, { passive: true });
    requestAnimationFrame(renderParticulate);
  }
});
