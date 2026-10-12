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

  // Featured Project link if available
  if (projectsData && projectsData.projects && projectsData.projects.length > 0) {
    const featuredId = projectsData.featuredProjectId || projectsData.projects[0].id;
    const featured = projectsData.projects.find(proj => proj.id === featuredId) || projectsData.projects[0];
    
    const heroTitle = document.querySelector("#hero-title");
    if (heroTitle && featured) {
      heroTitle.textContent = featured.title;
    }

    const heroExplore = document.querySelector("#hero-explore-btn");
    if (heroExplore && featured) {
      heroExplore.href = `project-detail.html?id=${featured.id}`;
    }

    const heroImage = document.querySelector("#hero-cover-image");
    if (heroImage && featured.coverImage) {
      heroImage.src = featured.coverImage;
      heroImage.alt = featured.title;
    }
  }
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

