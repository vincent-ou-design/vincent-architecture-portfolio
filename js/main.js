/**
 * ARCHITECTURAL PORTFOLIO - MAIN SCRIPT
 * Loads and populates metadata from data/site.json and data/projects.json
 * Enables easy updating without touching HTML.
 */

// Helper function to safely fetch JSON data
async function loadJSON(filepath) {
  try {
    const res = await fetch(filepath);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${filepath}`);
    return await res.json();
  } catch (err) {
    console.warn(`Could not load ${filepath}:`, err);
    return null;
  }
}

// Global initialization
document.addEventListener("DOMContentLoaded", async () => {
  setupPageTransitions();
  setupSmartHeader();

  const siteData = await loadJSON("data/site.json");
  const projectsData = await loadJSON("data/projects.json");

  if (siteData) {
    populateHeaderAndFooter(siteData);
  }

  // Page-specific initializers
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("index.html") || path.endsWith("/") || path.endsWith("/website%20building%20test%202/")) {
    initHomePage(siteData, projectsData);
  } else if (path.includes("about.html")) {
    initAboutPage(siteData);
  } else if (path.includes("projects.html")) {
    initProjectsPage(projectsData);
  }
});

/**
 * Injects header brand names and footer text across all pages
 */
function populateHeaderAndFooter(site) {
  const p = site.profile;
  if (!p) return;

  // Header Monogram & Names
  const monoEl = document.querySelector(".brand-monogram");
  if (monoEl && p.monogram) monoEl.textContent = p.monogram;

  const enNameEl = document.querySelector(".brand-en");
  if (enNameEl && p.englishName) enNameEl.textContent = p.englishName;

  const cnNameEl = document.querySelector(".brand-cn");
  if (cnNameEl && p.chineseName) cnNameEl.textContent = p.chineseName;

  // Document Title fallback
  if (p.englishName && document.title.includes("Portfolio")) {
    document.title = `${p.englishName} ${p.chineseName ? `(${p.chineseName})` : ""} | Portfolio`;
  }

  // Footer copyright
  const footerCopy = document.querySelector(".footer-copy");
  if (footerCopy) {
    const year = new Date().getFullYear();
    footerCopy.textContent = `© ${year} ${p.englishName} ${p.chineseName || ""}. All rights reserved.`;
  }

  // Footer social links
  const footerSocial = document.querySelector(".footer-social");
  if (footerSocial && p.socialLinks) {
    footerSocial.innerHTML = p.socialLinks
      .map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`)
      .join("");
  }
}

/**
 * Initializes Task 1: Home Page Hero
 */
function initHomePage(site, projectsData) {
  if (!site) return;
  const p = site.profile;

  // Subtitle / Title
  const heroSub = document.querySelector("#hero-subtitle");
  if (heroSub && p.title) heroSub.textContent = p.title;

  const heroDesc = document.querySelector("#hero-description");
  if (heroDesc && p.tagline) heroDesc.textContent = p.tagline;

  // Social Links
  const socialContainer = document.querySelector("#hero-social-links");
  if (socialContainer && p.socialLinks) {
    socialContainer.innerHTML = p.socialLinks
      .map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.name}</a>`)
      .join("");
  }

  // Featured Project & Pixelated Slideshow
  if (projectsData && projectsData.projects && projectsData.projects.length > 0) {
    setupHeroSlideshow(projectsData.projects);
  }
}

/**
 * Pixelated Transition Slideshow for Home Page Hero
 */
function setupHeroSlideshow(projects) {
  if (!projects || projects.length === 0) return;

  const canvas = document.querySelector("#hero-pixel-canvas");
  const heroImage = document.querySelector("#hero-cover-image");
  const heroTitle = document.querySelector("#hero-title");
  const heroDesc = document.querySelector("#hero-description");
  const heroExplore = document.querySelector("#hero-explore-btn");
  const counterEl = document.querySelector("#hero-slide-counter");
  const prevBtn = document.querySelector("#hero-prev-btn");
  const nextBtn = document.querySelector("#hero-next-btn");
  const heroContent = document.querySelector(".hero-content");
  const heroWrapper = document.querySelector(".hero-wrapper");

  let currentIndex = 0;
  let isTransitioning = false;
  let autoPlayTimer = null;

  // Preload all project cover images
  const loadedImages = {};
  projects.forEach((proj, idx) => {
    const img = new Image();
    img.src = proj.coverImage;
    loadedImages[idx] = img;
  });

  // Offscreen canvas for pixelation rasterization
  const offscreen = document.createElement("canvas");
  const offCtx = offscreen.getContext("2d");

  // Render image with customizable pixel block size
  function renderPixelated(img, pixelSize) {
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) return;

    // Cover math (like object-fit: cover)
    const natW = img.naturalWidth || cw;
    const natH = img.naturalHeight || ch;
    const imgRatio = natW / natH;
    const canvasRatio = cw / ch;
    let sw, sh, sx, sy;

    if (imgRatio > canvasRatio) {
      sh = natH;
      sw = natH * canvasRatio;
      sx = (natW - sw) / 2;
      sy = 0;
    } else {
      sw = natW;
      sh = natW / canvasRatio;
      sx = 0;
      sy = (natH - sh) / 2;
    }

    if (pixelSize <= 1.2) {
      ctx.imageSmoothingEnabled = true;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    } else {
      const smallW = Math.max(2, Math.floor(cw / pixelSize));
      const smallH = Math.max(2, Math.floor(ch / pixelSize));

      offscreen.width = smallW;
      offscreen.height = smallH;
      offCtx.imageSmoothingEnabled = true;
      offCtx.clearRect(0, 0, smallW, smallH);
      offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, smallW, smallH);

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(offscreen, 0, 0, smallW, smallH, 0, 0, cw, ch);
    }
  }

  // Keep canvas resolution synced to hero-media container
  function syncCanvasSize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
      const curImg = loadedImages[currentIndex] || heroImage;
      if (curImg && (curImg.complete || curImg.naturalWidth > 0)) {
        renderPixelated(curImg, 1);
      }
    }
  }

  window.addEventListener("resize", syncCanvasSize);
  setTimeout(syncCanvasSize, 120);

  // Direct transition to specific slide with pixelated dissolve
  function goToSlide(targetIndex) {
    if (isTransitioning || targetIndex === currentIndex) return;
    isTransitioning = true;

    const fromImg = loadedImages[currentIndex] || heroImage;
    const toProject = projects[targetIndex];
    const toImg = loadedImages[targetIndex];

    syncCanvasSize();
    canvas.classList.add("is-active");
    if (heroContent) heroContent.classList.add("is-fading");

    const duration = 420; // 420ms snappy architectural transition
    const startTime = performance.now();
    const maxPixelSize = 40; // Peak chunky pixel size

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      if (progress < 0.5) {
        // Phase 1: Dissolve out (pixel size scales up: 1 -> 40)
        const t = progress / 0.5;
        const pixelSize = 1 + (maxPixelSize - 1) * (t * t);
        renderPixelated(fromImg, pixelSize);
      } else {
        // Midpoint: update text & explore URL without shifting layout
        if (progress >= 0.5 && elapsed - 18 < duration * 0.5) {
          if (heroTitle) heroTitle.textContent = toProject.title;
          if (heroDesc) heroDesc.textContent = toProject.brief || toProject.description;
          if (heroExplore) heroExplore.href = `projects.html?id=${toProject.id}`;
          if (heroContent) heroContent.classList.remove("is-fading");
        }

        // Phase 2: Resolve in target image (pixel size scales down: 40 -> 1)
        const t = (progress - 0.5) / 0.5;
        const pixelSize = maxPixelSize - (maxPixelSize - 1) * Math.sqrt(t);
        renderPixelated(toImg, pixelSize);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete transition cleanly
        renderPixelated(toImg, 1);
        if (heroImage) {
          heroImage.src = toProject.coverImage;
          heroImage.alt = toProject.title;
        }
        setTimeout(() => {
          canvas.classList.remove("is-active");
        }, 40);

        currentIndex = targetIndex;
        isTransitioning = false;
        resetAutoPlay();
      }
    }

    requestAnimationFrame(animate);
  }

  // Pure automatic slideshow timer (every 4 seconds)
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(() => {
      if (!document.hidden && !isTransitioning) {
        goToSlide((currentIndex + 1) % projects.length);
      }
    }, 4000); // 4000ms = 4 seconds
  }

  function stopAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Start automatic slideshow immediately
  startAutoPlay();
}

/**
 * Page Transitions: Smooth blur-out before navigating to internal links.
 * Easily customizable in style.css (.page-transitioning).
 */
function setupPageTransitions() {
  document.querySelectorAll("a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || link.target === "_blank") {
      return;
    }

    link.addEventListener("click", e => {
      e.preventDefault();
      document.body.classList.add("page-transitioning");
      setTimeout(() => {
        window.location.href = href;
      }, 350);
    });
  });
}

/**
 * Initializes Task 2: About Page from site.json metadata
 */
function initAboutPage(site) {
  if (!site || !site.profile) return;
  const p = site.profile;
  const about = p.about || {};

  // Names & Title
  const nameEl = document.querySelector("#about-en-name");
  if (nameEl && p.englishName) nameEl.textContent = p.englishName;

  const cnEl = document.querySelector("#about-cn-name");
  if (cnEl && p.chineseName) cnEl.textContent = p.chineseName;

  const tagEl = document.querySelector("#about-title-tag");
  if (tagEl && p.title) tagEl.textContent = p.title;

  const locEl = document.querySelector("#about-location");
  if (locEl && p.location) locEl.textContent = p.location;

  const emailEl = document.querySelector("#about-email");
  if (emailEl && p.email) {
    emailEl.textContent = p.email;
    emailEl.href = `mailto:${p.email}`;
  }

  // Headline & Portrait
  const headlineEl = document.querySelector("#about-headline");
  if (headlineEl && about.headline) headlineEl.textContent = about.headline;

  const avatarEl = document.querySelector("#about-avatar");
  if (avatarEl && about.avatar) avatarEl.src = about.avatar;

  // Bio Paragraphs
  const p1 = document.querySelector("#about-p1");
  if (p1 && about.introParagraph1) p1.textContent = about.introParagraph1;

  const p2 = document.querySelector("#about-p2");
  if (p2 && about.introParagraph2) p2.textContent = about.introParagraph2;

  // Education List
  const eduContainer = document.querySelector("#about-education-list");
  if (eduContainer && about.education) {
    eduContainer.innerHTML = about.education
      .map(item => `<li><div><strong>${item.degree}</strong><br><span style="font-size:0.8rem;color:var(--text-subtle);">${item.institution}</span></div><span class="year">${item.year}</span></li>`)
      .join("");
  }

   // Experience List
  const expContainer = document.querySelector("#about-experience-list");
  if (expContainer && about.experience) {
    expContainer.innerHTML = about.experience
      .map(item => `
        <li style="margin-bottom: 0.8rem; flex-direction: column; align-items: flex-start;">
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <div>
              <strong>${item.role}</strong><br>
              <span style="font-size:0.8rem; color:var(--text-subtle);">${item.company}</span>
            </div>
            <span class="year">${item.period}</span>
          </div>
          ${item.description ? `<p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.35rem; line-height:1.4;">${item.description}</p>` : ''}
        </li>
      `)
      .join("");
  }

  // Skills Tags
  const skillsContainer = document.querySelector("#about-skills-list");
  if (skillsContainer && about.skills) {
    skillsContainer.innerHTML = about.skills
      .map(skill => `<span class="about-skill-pill">${skill}</span>`)
      .join("");
  }
}

/**
   * Smart Auto-Hiding Header:
   * Drops down while scrolling, waits 1 second, then slides up smoothly.
   */
  function setupSmartHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    let hideTimeout = null;
    window.addEventListener("scroll", () => {
      const currentScrollY = window.scrollY;
      // Always keep header visible at the very top of the page
      if (currentScrollY <= 10) {
        header.classList.remove("header-hidden");
        clearTimeout(hideTimeout);
        return;
      }
      // While scrolling, immediately drop down / show header
      header.classList.remove("header-hidden");
      // Reset the 1-second countdown
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        // After 1 second of no scrolling, slide up
        header.classList.add("header-hidden");
      }, 2000); // 1000ms = 1 second
    });
  }

/**
 * Initializes Task 3 & 4: Projects Landing Page Grid & Modal Gallery
 */
function initProjectsPage(projectsData) {
  const gridContainer = document.querySelector("#projects-grid");
  if (!gridContainer || !projectsData || !projectsData.projects) return;

  const projects = projectsData.projects;

  // Render project cards
  gridContainer.innerHTML = projects
    .map(p => `
      <article class="project-card" data-project-id="${p.id}" tabindex="0" role="button" aria-label="Open project ${p.title}">
        <div class="project-card-thumb">
          <img src="${p.coverImage}" alt="${p.title}" loading="lazy">
        </div>
        <div class="project-card-info">
          <h2 class="project-card-title">${p.title} <span class="project-card-year">(${p.year})</span></h2>
        </div>
      </article>
    `)
    .join("");

  // Touch highlight for mobile / tablet
  const cards = gridContainer.querySelectorAll(".project-card");
  cards.forEach(card => {
    card.addEventListener("touchstart", function() {
      cards.forEach(c => c.classList.remove("is-active"));
      this.classList.add("is-active");
    }, { passive: true });
  });

  // Setup modal and cycling gallery
  setupProjectModal(projectsData);

  setupPageTransitions();
}

/**
 * Task 4: Interactive Project Detail Modal & Infinite Looping Gallery
 */
function setupProjectModal(projectsData) {
  const modal = document.querySelector("#project-modal");
  if (!modal || !projectsData || !projectsData.projects) return;

  const closeBtn = document.querySelector("#modal-close-btn");
  const backdrop = document.querySelector("#modal-backdrop");
  const prevBtn = document.querySelector("#gallery-prev-btn");
  const nextBtn = document.querySelector("#gallery-next-btn");
  const currentImage = document.querySelector("#gallery-current-image");
  const captionEl = document.querySelector("#gallery-caption");
  const counterEl = document.querySelector("#gallery-counter");
  const viewport = document.querySelector("#gallery-viewport");

  // Info elements
  const categoryEl = document.querySelector("#modal-category");
  const yearEl = document.querySelector("#modal-year");
  const titleEl = document.querySelector("#modal-title");
  const locationEl = document.querySelector("#modal-location");
  const specsEl = document.querySelector("#modal-specs");
  const briefEl = document.querySelector("#modal-brief");
  const descEl = document.querySelector("#modal-description");

  let currentGallery = [];
  let currentPhotoIndex = 0;

  // Function to display current image with smooth transition
  function displayPhoto(index) {
    if (!currentGallery || currentGallery.length === 0) return;

    // Wrap around for looping
    currentPhotoIndex = (index + currentGallery.length) % currentGallery.length;
    const photo = currentGallery[currentPhotoIndex];

    if (currentImage) {
      currentImage.classList.add("is-fading");
      setTimeout(() => {
        currentImage.src = photo.url;
        currentImage.alt = photo.caption || "Project photo";
        currentImage.classList.remove("is-fading");
      }, 120);
    }

    if (captionEl) {
      captionEl.textContent = photo.caption || "";
    }

    if (counterEl) {
      const currentNum = String(currentPhotoIndex + 1).padStart(2, "0");
      const totalNum = String(currentGallery.length).padStart(2, "0");
      counterEl.textContent = `${currentNum} / ${totalNum}`;
    }
  }

  // Function to open modal and populate data
  function openProjectModal(projectId) {
    const project = projectsData.projects.find(p => p.id === projectId);
    if (!project) return;

    // Populate editorial info
    if (categoryEl) categoryEl.textContent = project.category || "Architecture";
    if (yearEl) yearEl.textContent = project.year || "";
    if (titleEl) titleEl.textContent = project.title || "";
    if (locationEl) locationEl.textContent = project.location || "";
    if (briefEl) briefEl.textContent = project.brief || "";
    if (descEl) {
      if (Array.isArray(project.description)) {
        descEl.innerHTML = project.description
          .map(para => `<p style="margin-bottom: 0.8rem;">${para}</p>`)
          .join("");
      } else if (typeof project.description === "string" && project.description.includes("\n")) {
        descEl.innerHTML = project.description
          .split("\n")
          .filter(p => p.trim())
          .map(para => `<p style="margin-bottom: 0.8rem;">${para}</p>`)
          .join("");
      } else {
        descEl.textContent = project.description || "";
      }
    }

    // Populate specs grid
    if (specsEl) {
      const details = project.details || {};
      const specs = [
        { label: "Typology", value: details.typology || project.category },
        { label: "Scale", value: details.scale || "—" },
        { label: "Status", value: details.status || "—" },
        { label: "Timeline", value: project.year || "—" }
      ];

      specsEl.innerHTML = specs
        .map(s => `
          <div class="modal-spec-item">
            <span class="modal-spec-label">${s.label}</span>
            <span class="modal-spec-value">${s.value}</span>
          </div>
        `)
        .join("");
    }

    // Prepare gallery photos (use gallery array, fallback to coverImage)
    currentGallery = (project.gallery && project.gallery.length > 0)
      ? project.gallery
      : [{ url: project.coverImage, caption: project.title }];

    currentPhotoIndex = 0;
    displayPhoto(0);

    // Show modal & freeze background scroll
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  // Function to close modal
  function closeProjectModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  // Card click & keyboard Enter handler
  document.querySelectorAll(".project-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-project-id");
      openProjectModal(id);
    });

    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const id = card.getAttribute("data-project-id");
        openProjectModal(id);
      }
    });
  });

  // Next / Prev Button click handlers (Looping!)
  if (nextBtn) {
    nextBtn.addEventListener("click", e => {
      e.stopPropagation();
      displayPhoto(currentPhotoIndex + 1);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", e => {
      e.stopPropagation();
      displayPhoto(currentPhotoIndex - 1);
    });
  }

  // Close handlers
  if (closeBtn) closeBtn.addEventListener("click", closeProjectModal);
  if (backdrop) backdrop.addEventListener("click", closeProjectModal);

  // Keyboard navigation when modal is open
  window.addEventListener("keydown", e => {
    if (!modal.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closeProjectModal();
    } else if (e.key === "ArrowRight") {
      displayPhoto(currentPhotoIndex + 1);
    } else if (e.key === "ArrowLeft") {
      displayPhoto(currentPhotoIndex - 1);
    }
  });

  // Touch Swipe on mobile/tablet gallery
  let touchStartX = 0;
  let touchEndX = 0;

  if (viewport) {
    viewport.addEventListener("touchstart", e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener("touchend", e => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchEndX - touchStartX;
      if (swipeDistance < -45) {
        // Swiped Left -> Next image
        displayPhoto(currentPhotoIndex + 1);
      } else if (swipeDistance > 45) {
        // Swiped Right -> Previous image
        displayPhoto(currentPhotoIndex - 1);
      }
    }, { passive: true });
  }

  // Direct URL support: ?project=project-01 or ?id=project-01
  const urlParams = new URLSearchParams(window.location.search);
  const targetId = urlParams.get("project") || urlParams.get("id");
  if (targetId) {
    openProjectModal(targetId);
  }
}



