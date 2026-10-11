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
  const siteData = await loadJSON("data/site.json");
  const projectsData = await loadJSON("data/projects.json");

  if (siteData) {
    populateHeaderAndFooter(siteData);
  }

  // Page-specific initializers
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("index.html") || path.endsWith("/") || path.endsWith("/website%20building%20test%202/")) {
    initHomePage(siteData, projectsData);
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
