(function () {
  "use strict";

  let activeCategory = "all";
  let searchQuery = "";

  const params = new URLSearchParams(window.location.search);
  if (params.get("category")) activeCategory = params.get("category");
  if (params.get("q")) {
    searchQuery = params.get("q").trim();
    const input = document.getElementById("searchInput");
    if (input) input.value = searchQuery;
  }

  function filterCourses() {
    return EduTube.courses.filter((course) => {
      const matchCat = activeCategory === "all" || course.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        course.title.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.instructor.toLowerCase().includes(q) ||
        getCategoryLabel(course.category).toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }

  function renderStats() {
    const lessons = EduTube.courses.reduce((n, c) => n + c.lessons.length, 0);
    document.getElementById("statCourses").textContent = EduTube.courses.length;
    document.getElementById("statLessons").textContent = lessons;
    document.getElementById("statCategories").textContent = EduTube.categories.length;
  }

  function renderCategories() {
    const grid = document.getElementById("categoryGrid");
    if (!grid) return;

    const allBtn = `<button type="button" class="category-card${activeCategory === "all" ? " active" : ""}" data-cat="all">
      <span class="icon">📚</span>
      <h3>All</h3>
    </button>`;

    const cards = EduTube.categories
      .map(
        (cat) => `<button type="button" class="category-card${activeCategory === cat.id ? " active" : ""}" data-cat="${cat.id}">
        <span class="icon">${cat.icon}</span>
        <h3>${cat.label}</h3>
      </button>`
      )
      .join("");

    grid.innerHTML = allBtn + cards;

    grid.querySelectorAll(".category-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeCategory = btn.dataset.cat;
        renderCategories();
        renderFilterBar();
        renderCourses();
        const url = new URL(window.location.href);
        if (activeCategory === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", activeCategory);
        history.replaceState({}, "", url);
        document.getElementById("courses")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function renderFilterBar() {
    const bar = document.getElementById("filterBar");
    if (!bar) return;

    const levels = ["all", "Beginner", "Intermediate", "Advanced"];
    bar.innerHTML = levels
      .map(
        (lvl) =>
          `<button type="button" class="filter-pill" data-level="${lvl}">${lvl === "all" ? "All levels" : lvl}</button>`
      )
      .join("");

    bar.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        bar.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const level = pill.dataset.level;
        renderCourses(level === "all" ? null : level);
      });
    });
    bar.querySelector('[data-level="all"]')?.classList.add("active");
  }

  function renderContinue() {
    const row = document.getElementById("continueRow");
    const section = document.getElementById("continue");
    if (!row) return;

    const inProgress = getCoursesInProgress();
    if (!inProgress.length) {
      row.innerHTML = `<p class="empty-hint">Start a course to see your progress here.</p>`;
      return;
    }

    row.innerHTML = inProgress
      .slice(0, 6)
      .map(({ course }) => renderCourseCard(course, { showButton: true }))
      .join("");

    const btn = document.getElementById("continueBtn");
    if (btn) btn.href = "#continue";
  }

  function renderCourses(levelFilter = null) {
    let filtered = filterCourses();
    if (levelFilter) filtered = filtered.filter((c) => c.level === levelFilter);

    const grid = document.getElementById("courseGrid");
    const empty = document.getElementById("emptyState");
    const title = document.getElementById("coursesTitle");
    const meta = document.getElementById("coursesMeta");

    if (title) {
      title.textContent =
        activeCategory === "all"
          ? "All Courses"
          : getCategoryLabel(activeCategory);
    }
    if (meta) {
      meta.textContent = searchQuery
        ? `${filtered.length} result(s) for “${searchQuery}”`
        : `${filtered.length} course(s) available`;
    }

    const featured = filtered.filter((c) => c.featured);
    const rest = filtered.filter((c) => !c.featured);
    const ordered = [...featured, ...rest];

    grid.innerHTML = ordered.map((c) => renderCourseCard(c)).join("");
    empty?.classList.toggle("hidden", filtered.length > 0);
  }

  function initSearch() {
    document.getElementById("searchForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      searchQuery = document.getElementById("searchInput")?.value?.trim() || "";
      activeCategory = "all";
      renderCategories();
      renderCourses();
      const url = new URL(window.location.href);
      if (searchQuery) url.searchParams.set("q", searchQuery);
      else url.searchParams.delete("q");
      url.searchParams.delete("category");
      history.replaceState({}, "", url);
    });
  }

  async function init() {
    initTheme();
    initNav();
    bindThemeToggle();
    setYear();

    try {
      await loadEduTubeData();
      document.getElementById("loadingOverlay")?.classList.add("hidden");
      renderStats();
      renderCategories();
      renderFilterBar();
      renderContinue();
      renderCourses();
      initSearch();
    } catch (err) {
      document.getElementById("loadingOverlay").innerHTML = `<p style="max-width:400px;text-align:center;padding:1rem">${err.message}</p>
        <p style="font-size:0.9rem;margin-top:1rem">Run: <code>npx serve .</code> inside the edutube folder</p>`;
    }
  }

  init();
})();
