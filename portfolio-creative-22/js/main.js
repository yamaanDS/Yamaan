/* ============================================================
   MAIN.JS — renders every section from js/data.js and wires up
   navigation, dark mode, filters, modals, and the lightbox.
   You should not need to edit this file to update content —
   edit js/data.js instead.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------- small helpers ---------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

  const ICONS = {
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 20.4h-3.5v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.05c.5-.9 1.6-1.9 3.3-1.9 3.6 0 4.2 2.3 4.2 5.3v6.4zM5.3 7.4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM7 20.4H3.6V9H7v11.4zM22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0z"/></svg>',
    scholar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 0 9l4 2.2v6.6L12 22l8-4.2v-6.6L22 9 12 2zm0 2.3 7.1 3.9L12 12.1 4.9 8.2 12 4.3zM6 12.7l5 2.8 5-2.8v4.4L12 20l-6-3v-4.3z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.8 5.4.8 11.7c0 5 3.2 9.2 7.7 10.7.6.1.8-.2.8-.6v-2.2c-3.1.7-3.8-1.5-3.8-1.5-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.6.1-.6 1.1.1 1.7 1.1 1.7 1.1 1 1.7 2.6 1.2 3.2.9.1-.7.4-1.2.7-1.5-2.5-.3-5.1-1.2-5.1-5.5 0-1.2.4-2.2 1.1-3-.1-.3-.5-1.5.1-3.1 0 0 .9-.3 3 1.1a10.4 10.4 0 0 1 5.5 0c2.1-1.4 3-1.1 3-1.1.6 1.6.2 2.8.1 3.1.7.8 1.1 1.8 1.1 3 0 4.3-2.6 5.2-5.1 5.5.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.5-1.5 7.7-5.7 7.7-10.7C23.2 5.4 18.3.5 12 .5z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 4h20v16H2V4zm2 2 8 6 8-6H4zm0 2.3V18h16V8.3l-8 6-8-6z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.7 14.9A8.7 8.7 0 1 1 9.1 3.3a7 7 0 0 0 11.6 11.6z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 2h7l5 5v15H7V2z"/><path d="M14 2v5h5"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 4h6v6M20 4l-9 9M6 6h4v0H6v12h12v-4"/></svg>',
  };
  const icon = (name) => ICONS[name] || "";
  const pad2 = (n) => String(n).padStart(2, "0");

  /* ============================================================
     THEME
     ============================================================ */
  function initTheme() {
    const saved = localStorageGet("theme");
    const theme = saved || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
    $("#themeToggle").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorageSet("theme", next);
      updateThemeIcon(next);
    });
  }
  function updateThemeIcon(theme) {
    $("#themeToggle").innerHTML = theme === "dark" ? icon("sun") : icon("moon");
  }
  let memTheme = null;
  function localStorageGet(k) {
    try { return localStorage.getItem(k); } catch (e) { return memTheme; }
  }
  function localStorageSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { memTheme = v; }
  }

  /* ============================================================
     NAV
     ============================================================ */
  function initNav() {
    const hamburger = $("#hamburger");
    const mobileMenu = $("#mobileMenu");
    hamburger.addEventListener("click", () => mobileMenu.classList.toggle("open"));
    $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => mobileMenu.classList.remove("open")));

    const sections = $$("section[id]");
    const navLinks = $$(".nav-links a");
    const onScroll = () => {
      let current = sections[0]?.id;
      const y = window.scrollY + 140;
      sections.forEach((s) => { if (s.offsetTop <= y) current = s.id; });
      navLinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + current));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     HERO / ABOUT / FOOTER basics
     ============================================================ */
  function renderIdentity() {
    document.title = `${SITE.name} — ${SITE.role}`;
    $$(".js-name").forEach((n) => (n.textContent = SITE.name));
    $$(".js-initials").forEach((n) => (n.textContent = SITE.initials));
    $$(".js-role").forEach((n) => (n.textContent = SITE.role));
    $$(".js-tagline").forEach((n) => (n.textContent = SITE.tagline));
    $$(".js-dept").forEach((n) => (n.textContent = SITE.department));
    $$(".js-university").forEach((n) => (n.textContent = SITE.university));
    $$(".js-hero-dept").forEach((n) => (n.textContent = SITE.department));
    $$(".js-hero-univ").forEach((n) => (n.textContent = SITE.university));
    $$(".js-year").forEach((n) => (n.textContent = new Date().getFullYear()));
    $$(".js-cv-link").forEach((a) => (a.href = SITE.cvFile));

    $$(".js-social").forEach((container) => {
      container.innerHTML = "";
      const items = [
        ["linkedin", SITE.social.linkedin],
        ["scholar", SITE.social.scholar],
        ["github", SITE.social.github],
        ["email", SITE.social.email],
      ];
      items.forEach(([key, href]) => {
        if (!href) return;
        const a = el("a", "social-icon", icon(key));
        a.href = href;
        a.target = key === "email" ? "_self" : "_blank";
        a.rel = "noopener";
        a.setAttribute("aria-label", key);
        container.appendChild(a);
      });
    });

    $$(".js-photo").forEach((frame) => setImageOrFallback(frame, SITE.profileImage, SITE.initials));
  }

  function setImageOrFallback(frame, src, fallbackText) {
    frame.innerHTML = "";
    if (!src) {
      frame.appendChild(el("div", "avatar-fallback", esc(fallbackText || "?")));
      return;
    }
    const img = new Image();
    img.alt = SITE.name;
    img.onload = () => frame.appendChild(img);
    img.onerror = () => {
      frame.innerHTML = "";
      frame.appendChild(el("div", "avatar-fallback", esc(fallbackText || "?")));
    };
    img.src = src;
  }

  function tryLoadFirst(container, candidates, label) {
    const showFallback = () => {
      container.innerHTML = "";
      container.appendChild(el("div", "ph-fallback", `No image yet —\nadd one for "${esc(label)}" in js/data.js`));
    };
    if (!candidates.length) return showFallback();
    const [first, ...rest] = candidates;
    const img = new Image();
    img.alt = label || "";
    img.onload = () => { container.innerHTML = ""; container.appendChild(img); };
    img.onerror = () => tryLoadFirst(container, rest, label);
    img.src = first;
  }

  function setThumbOrFallback(container, src, label) {
    container.innerHTML = "";
    const showFallback = () => {
      container.innerHTML = "";
      container.appendChild(el("div", "ph-fallback", esc(label || "No image")));
    };
    if (!src) return showFallback();
    const img = new Image();
    img.alt = label || "";
    img.onload = () => container.appendChild(img);
    img.onerror = showFallback;
    img.src = src;
  }

  /* ============================================================
     HERO STATS — concrete numbers, no publications
     ============================================================ */
  function renderHeroStats() {
    const cgpa = (EDUCATION[0] && EDUCATION[0].cgpa) || "";
    const stats = [
      { num: cgpa, unit: "", lbl: "CGPA" },
      { num: PROJECTS.length, unit: "", lbl: "Projects" },
      { num: CERTIFICATIONS.length, unit: "", lbl: "Certifications" },
      { num: ACTIVITIES.length, unit: "", lbl: "Activities" },
    ];
    $("#heroStats").innerHTML = stats
      .map((s) => `<div class="hero-stat"><div class="num">${esc(s.num)}</div><div class="lbl">${esc(s.lbl)}</div></div>`)
      .join("");
  }

  /* ============================================================
     ABOUT
     ============================================================ */
  function renderAbout() {
    $("#aboutBio").innerHTML = SITE.about.bio
      .split("\n")
      .filter(Boolean)
      .map((p) => `<p>${esc(p)}</p>`)
      .join("");
    $("#aboutPhilosophy").textContent = SITE.about.philosophy;
    $("#aboutGoals").textContent = SITE.about.careerGoals;
    fillTags($("#academicInterestTags"), SITE.about.academicInterests);
  }
  function fillTags(container, arr) {
    container.innerHTML = "";
    (arr || []).forEach((t) => container.appendChild(el("span", "tag", esc(t))));
  }

  /* ============================================================
     EDUCATION
     ============================================================ */
  function renderEducation() {
    const wrap = $("#educationTimeline");
    wrap.innerHTML = "";
    EDUCATION.forEach((e) => {
      const item = el("div", "tl-item");
      item.innerHTML = `
        <div class="tl-card">
          <div class="tl-card-head">
            <div>
              <h3>${esc(e.institution)}</h3>
              <div class="tl-org">${esc(e.degree)}</div>
            </div>
            <div class="tl-meta">${esc(e.start)} — ${esc(e.end)}<br>${esc(e.location)}${e.cgpa ? "<br>CGPA " + esc(e.cgpa) : e.gpa ? "<br>" + esc(e.gpa) : ""}</div>
          </div>
          ${e.description ? `<p class="tl-desc">${esc(e.description)}</p>` : ""}
          ${e.coursework && e.coursework.length ? `<div class="tag-row" style="margin-top:14px;">${e.coursework.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</div>` : ""}
        </div>`;
      wrap.appendChild(item);
    });
  }

  /* ============================================================
     EXPERIENCE
     ============================================================ */
  function renderExperience() {
    const wrap = $("#experienceTimeline");
    wrap.innerHTML = "";
    if (!EXPERIENCE.length) {
      wrap.appendChild(el("p", "", "Add entries to the EXPERIENCE array in js/data.js to populate this section."));
      return;
    }
    EXPERIENCE.forEach((x, i) => {
      const id = `exp-${i}`;
      const item = el("div", "tl-item");
      item.innerHTML = `
        <div class="tl-card">
          <div class="tl-card-head">
            <div>
              <h3>${esc(x.title)}</h3>
              <div class="tl-org">${esc(x.organization)}${x.type ? " · " + esc(x.type) : ""}</div>
            </div>
            <div class="tl-meta">${esc(x.start)} — ${esc(x.end)}<br>${esc(x.location)}</div>
          </div>
          ${x.skills && x.skills.length ? `<div class="tag-row" style="margin-top:14px;">${x.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
          <button class="tl-toggle" data-target="${id}">View details</button>
          <div class="tl-extra" id="${id}">
            ${x.responsibilities && x.responsibilities.length ? `<h5>Responsibilities</h5><ul>${x.responsibilities.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
            ${x.achievements && x.achievements.length ? `<h5>Key achievements</h5><ul>${x.achievements.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : ""}
          </div>
        </div>`;
      wrap.appendChild(item);
    });
    $$(".tl-toggle", wrap).forEach((btn) =>
      btn.addEventListener("click", () => {
        const target = $("#" + btn.dataset.target);
        const open = target.classList.toggle("open");
        btn.textContent = open ? "Hide details" : "View details";
      })
    );
  }

  /* ============================================================
     ACTIVITIES — scroll showcase
     ============================================================ */
  function renderActivities() {
    const list = $("#activityList");
    const photoFrame = $("#activityPhotoFrame");
    list.innerHTML = "";
    photoFrame.innerHTML = "";

    if (!ACTIVITIES.length) {
      list.appendChild(el("p", "", "Add entries to the ACTIVITIES array in js/data.js to populate this section."));
      photoFrame.appendChild(el("div", "ph-fallback", "No activities yet"));
      return;
    }

    ACTIVITIES.forEach((a, i) => {
      const entry = el("div", "activity-entry reveal");
      entry.dataset.index = i;
      const metaParts = [a.organization, a.date, a.location].filter(Boolean).join(" · ");
      entry.innerHTML = `
        <div class="activity-index mono">${pad2(i + 1)} / ${pad2(ACTIVITIES.length)}</div>
        <h3>${esc(a.title)}</h3>
        ${a.role ? `<div class="activity-role">${esc(a.role)}</div>` : ""}
        <div class="activity-meta">${esc(metaParts)}</div>
        <p class="activity-desc">${esc(a.detailDescription || "")}</p>
        ${a.skills && a.skills.length ? `<div class="tag-row activity-skills">${a.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
        <div class="activity-more">
          <button class="btn btn-outline btn-sm act-expand">Read more</button>
          ${a.certificate ? `<button class="btn btn-outline btn-sm act-cert">View certificate</button>` : ""}
        </div>`;
      list.appendChild(entry);

      const slide = el("div", "activity-slide" + (i === 0 ? " active" : ""));
      slide.dataset.activity = i;
      photoFrame.appendChild(slide);
      const candidates = a.images && a.images.length ? a.images.slice() : [];
      tryLoadFirst(slide, candidates, a.title);

      const descEl = $(".activity-desc", entry);
      const expandBtn = $(".act-expand", entry);
      expandBtn.addEventListener("click", () => {
        const expanded = descEl.classList.toggle("expanded");
        expandBtn.textContent = expanded ? "Show less" : "Read more";
      });

      const certBtn = $(".act-cert", entry);
      if (certBtn) certBtn.addEventListener("click", () => openLightbox(a.certificate));
    });

    photoFrame.style.cursor = "zoom-in";
    photoFrame.addEventListener("click", () => {
      const activeSlide = photoFrame.querySelector(".activity-slide.active img");
      if (activeSlide) openLightbox(activeSlide.src);
    });

    const entries = $$(".activity-entry", list);
    const io = new IntersectionObserver(
      (obs) => {
        obs.forEach((o) => {
          if (o.isIntersecting) {
            entries.forEach((e) => e.classList.remove("in-view"));
            o.target.classList.add("in-view");
            const idx = o.target.dataset.index;
            $$(".activity-slide", photoFrame).forEach((slide) => slide.classList.toggle("active", slide.dataset.activity === idx));
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 }
    );
    entries.forEach((e) => io.observe(e));
  }

  /* ============================================================
     SKILLS
     ============================================================ */
  function projectsForSkill(key) {
    return PROJECTS.filter((p) => p.skills && p.skills.includes(key));
  }

  function renderSkills() {
    const wrap = $("#skillsGrid");
    wrap.innerHTML = "";
    SKILL_CATEGORIES.forEach((cat) => {
      const catEl = el("div", "skill-cat");
      const chips = cat.skills
        .map((s) => {
          const count = projectsForSkill(s.key).length;
          return `<button class="skill-chip" data-skill="${esc(s.key)}">${esc(s.name)}${count ? `<span class="count">${count}</span>` : ""}</button>`;
        })
        .join("");
      catEl.innerHTML = `<h3>${esc(cat.category)}</h3><div class="skill-chips">${chips}</div>`;
      wrap.appendChild(catEl);
    });
    $$(".skill-chip", wrap).forEach((chip) => chip.addEventListener("click", () => openSkillModal(chip.dataset.skill)));
  }

  function skillNameByKey(key) {
    for (const cat of SKILL_CATEGORIES) {
      const s = cat.skills.find((s) => s.key === key);
      if (s) return s.name;
    }
    return key;
  }

  function openSkillModal(key) {
    const projs = projectsForSkill(key);
    const body = `
      <button class="modal-close" data-close>&times;</button>
      <div class="modal-meta">Skill</div>
      <h3>${esc(skillNameByKey(key))}</h3>
      <div class="modal-section">
        <h5>Projects using this skill</h5>
        ${
          projs.length
            ? `<div class="card-grid" style="grid-template-columns:repeat(2,1fr); margin-top:14px;">${projs.map((p) => projectCardHTML(p)).join("")}</div>`
            : `<p>No linked projects yet — add "${esc(key)}" to a project's skills array in js/data.js.</p>`
        }
      </div>`;
    openModal(body, "skillModal");
    $$(".project-card", $("#skillModal .modal-box")).forEach((card, i) => {
      card.addEventListener("click", () => {
        closeModal("skillModal");
        setTimeout(() => openProjectModal(projs[i]), 150);
      });
      setThumbOrFallback($(".project-thumb", card), projs[i].image, projs[i].title);
    });
  }

  /* ============================================================
     PROJECTS
     ============================================================ */
  function projectCardHTML(p) {
    return `
      <div class="project-card" data-title="${esc(p.title)}">
        <div class="project-thumb reg-frame"></div>
        <div class="project-body">
          <div class="project-cat">${esc(p.category)} · ${esc(p.date)}</div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          <div class="project-tools">${(p.tools || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
      </div>`;
  }

  function renderProjects() {
    const cats = ["All", ...Array.from(new Set(PROJECTS.map((p) => p.category)))];
    const filterRow = $("#projectFilters");
    filterRow.innerHTML = cats.map((c, i) => `<button class="filter-btn ${i === 0 ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");

    const grid = $("#projectGrid");
    function paint(cat) {
      const items = cat === "All" ? PROJECTS : PROJECTS.filter((p) => p.category === cat);
      grid.innerHTML = items.map((p) => projectCardHTML(p)).join("");
      $$(".project-card", grid).forEach((card, i) => {
        setThumbOrFallback($(".project-thumb", card), items[i].image, items[i].title);
        card.addEventListener("click", () => openProjectModal(items[i]));
      });
      if (!items.length) grid.appendChild(el("p", "", "No projects in this category yet."));
    }
    paint("All");
    $$(".filter-btn", filterRow).forEach((btn) =>
      btn.addEventListener("click", () => {
        $$(".filter-btn", filterRow).forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        paint(btn.dataset.cat);
      })
    );
  }

  function openProjectModal(p) {
    const links = [];
    if (p.report) links.push(`<a class="btn btn-outline btn-sm" href="${esc(p.report)}" target="_blank" rel="noopener">${icon("doc")} View report</a>`);
    if (p.github) links.push(`<a class="btn btn-outline btn-sm" href="${esc(p.github)}" target="_blank" rel="noopener">${icon("github")} GitHub</a>`);
    if (p.demo) links.push(`<a class="btn btn-primary btn-sm" href="${esc(p.demo)}" target="_blank" rel="noopener">${icon("external")} Live demo</a>`);

    const body = `
      <button class="modal-close" data-close>&times;</button>
      <div class="modal-meta">${esc(p.category)} · ${esc(p.date)}</div>
      <h3>${esc(p.title)}</h3>
      ${p.problem ? `<div class="modal-section"><h5>Problem</h5><p>${esc(p.problem)}</p></div>` : ""}
      ${p.contribution ? `<div class="modal-section"><h5>My contribution</h5><p>${esc(p.contribution)}</p></div>` : ""}
      ${p.methodology ? `<div class="modal-section"><h5>Methodology</h5><p>${esc(p.methodology)}</p></div>` : ""}
      ${p.results ? `<div class="modal-section"><h5>Results</h5><p>${esc(p.results)}</p></div>` : ""}
      ${p.tools && p.tools.length ? `<div class="modal-section"><h5>Tools</h5><div class="tag-row">${p.tools.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></div>` : ""}
      ${links.length ? `<div class="modal-actions">${links.join("")}</div>` : ""}`;
    openModal(body, "projectModal");
  }

  /* ============================================================
     ACHIEVEMENTS
     ============================================================ */
  function renderAchievements() {
    const grid = $("#achievementGrid");
    if (!ACHIEVEMENTS.length) {
      grid.innerHTML = "";
      return;
    }
    grid.innerHTML = ACHIEVEMENTS.map(
      (a) => `
      <div class="simple-card reveal">
        <h3>${esc(a.title)}</h3>
        <div class="org">${esc(a.organization)}</div>
        <div class="date mono">${esc(a.date)}</div>
        ${a.description ? `<p>${esc(a.description)}</p>` : ""}
        <div class="link-row">
          ${a.image ? `<button class="btn btn-outline btn-sm act-ach-img" data-img="${esc(a.image)}">View image</button>` : ""}
          ${a.link ? `<a class="btn btn-outline btn-sm" href="${esc(a.link)}" target="_blank" rel="noopener">${icon("external")} Link</a>` : ""}
        </div>
      </div>`
    ).join("");
    $$(".act-ach-img", grid).forEach((btn) => btn.addEventListener("click", () => openLightbox(btn.dataset.img)));
  }

  /* ============================================================
     CERTIFICATIONS
     ============================================================ */
  function renderCertifications() {
    const grid = $("#certGrid");
    if (!CERTIFICATIONS.length) {
      grid.innerHTML = "";
      return;
    }
    grid.innerHTML = CERTIFICATIONS.map(
      (c) => `
      <div class="simple-card reveal">
        <h3>${esc(c.name)}</h3>
        <div class="org">${esc(c.issuer)}</div>
        <div class="date mono">${esc(c.date)}${c.credentialId ? " · ID " + esc(c.credentialId) : ""}</div>
        ${c.skills && c.skills.length ? `<div class="tag-row" style="margin-top:12px;">${c.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>` : ""}
        <div class="link-row">
          ${c.image ? `<button class="btn btn-primary btn-sm act-cert-img" data-img="${esc(c.image)}">View certificate</button>` : ""}
          ${c.verifyLink ? `<a class="btn btn-outline btn-sm" href="${esc(c.verifyLink)}" target="_blank" rel="noopener">Verify</a>` : ""}
        </div>
      </div>`
    ).join("");
    $$(".act-cert-img", grid).forEach((btn) => btn.addEventListener("click", () => openLightbox(btn.dataset.img)));
  }

  /* ============================================================
     RESUME (auto-summarized — no publications column)
     ============================================================ */
  function renderResume() {
    const listHTML = (items) => `<ul>${items.join("")}</ul>`;
    $("#resumeEducation").innerHTML = listHTML(
      EDUCATION.map((e) => `<li>${esc(e.degree)}, ${esc(e.institution)} <span class="d">${esc(e.start)}–${esc(e.end)}</span></li>`)
    );
    $("#resumeExperience").innerHTML = EXPERIENCE.length
      ? listHTML(EXPERIENCE.map((x) => `<li>${esc(x.title)}, ${esc(x.organization)} <span class="d">${esc(x.start)}–${esc(x.end)}</span></li>`))
      : "<p style='color:var(--ink-faint); font-size:14px;'>None yet.</p>";
    $("#resumeProjects").innerHTML = PROJECTS.length
      ? listHTML(PROJECTS.map((p) => `<li>${esc(p.title)} <span class="d">${esc(p.category)}</span></li>`))
      : "<p style='color:var(--ink-faint); font-size:14px;'>None yet.</p>";
    $("#resumeActivities").innerHTML = ACTIVITIES.length
      ? listHTML(ACTIVITIES.map((a) => `<li>${esc(a.title)} <span class="d">${esc(a.date)}</span></li>`))
      : "<p style='color:var(--ink-faint); font-size:14px;'>None yet.</p>";
    const allSkills = SKILL_CATEGORIES.flatMap((c) => c.skills.map((s) => s.name));
    $("#resumeSkills").innerHTML = `<div class="tag-row">${allSkills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div>`;
  }

  /* ============================================================
     CONTACT
     ============================================================ */
  function initContact() {
    const links = $("#contactLinksList");
    const items = [
      ["email", "Email", SITE.social.email],
      ["linkedin", "LinkedIn", SITE.social.linkedin],
      ["scholar", "Google Scholar", SITE.social.scholar],
      ["github", "GitHub", SITE.social.github],
    ];
    links.innerHTML = items
      .filter(([, , href]) => href)
      .map(([key, label, href]) => `<a class="contact-link" href="${esc(href)}" target="${key === "email" ? "_self" : "_blank"}" rel="noopener">${icon(key)} ${esc(label)}</a>`)
      .join("");

    const form = $("#contactForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cf-name").value.trim();
      const email = $("#cf-email").value.trim();
      const subject = $("#cf-subject").value.trim() || "Portfolio contact";
      const message = $("#cf-message").value.trim();
      const status = $("#formStatus");
      if (!name || !email || !message) {
        status.textContent = "Please fill in your name, email, and message.";
        return;
      }
      const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
      window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${body}`;
      status.textContent = "Opening your email client to send this message…";
    });
  }

  /* ============================================================
     MODAL + LIGHTBOX plumbing
     ============================================================ */
  function openModal(innerHTML, id) {
    let overlay = $("#" + id);
    if (!overlay) {
      overlay = el("div", "modal-overlay");
      overlay.id = id;
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal-box">${innerHTML}</div>`;
    overlay.classList.add("open");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-close]")) closeModal(id);
    });
    document.addEventListener("keydown", escCloser(id));
  }
  function closeModal(id) {
    const overlay = $("#" + id);
    if (overlay) overlay.classList.remove("open");
  }
  function escCloser(id) {
    return function handler(e) {
      if (e.key === "Escape") {
        closeModal(id);
        document.removeEventListener("keydown", handler);
      }
    };
  }

  function openLightbox(src) {
    if (!src) return;
    const overlay = $("#lightbox");
    overlay.innerHTML = `<button class="lightbox-close" data-lb-close>&times;</button><img src="${esc(src)}" alt="">`;
    overlay.classList.add("open");
  }
  function initLightbox() {
    const overlay = el("div", "lightbox-overlay");
    overlay.id = "lightbox";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-lb-close]")) overlay.classList.remove("open");
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") overlay.classList.remove("open");
    });
  }

  /* ============================================================
     SCROLL REVEAL
     ============================================================ */
  function initReveal() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    $$(".reveal").forEach((n) => io.observe(n));
  }

  /* ============================================================
     BOOT
     ============================================================ */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNav();
    renderIdentity();
    renderHeroStats();
    renderAbout();
    renderExperience();
    renderEducation();
    renderActivities();
    renderSkills();
    renderProjects();
    renderAchievements();
    renderCertifications();
    renderResume();
    initContact();
    initLightbox();
    setTimeout(initReveal, 50);
  });
})();
