/**
 * EduTube — shared utilities (no backend)
 */
const EduTube = {
  categories: [],
  courses: [],
  loaded: false,
};

const PROGRESS_KEY = "edutube-progress";
const THEME_KEY = "edutube-theme";

async function loadEduTubeData() {
  if (EduTube.loaded) return EduTube;

  const base = document.querySelector("script[data-base]")?.dataset.base || "";

  try {
    const [catRes, courseRes] = await Promise.all([
      fetch(`${base}data/categories.json`),
      fetch(`${base}data/courses.json`),
    ]);

    if (!catRes.ok || !courseRes.ok) {
      throw new Error("Failed to load JSON data");
    }

    EduTube.categories = await catRes.json();
    EduTube.courses = await courseRes.json();
    EduTube.loaded = true;
    return EduTube;
  } catch (err) {
    console.error(err);
    throw new Error(
      "Could not load course data. Run EduTube with a local server (see README). " +
        "Opening index.html directly may block JSON loading."
    );
  }
}

function youtubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function youtubeEmbed(videoId) {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

function getCourseById(id) {
  return EduTube.courses.find((c) => c.id === id);
}

function getCategoryById(id) {
  return EduTube.categories.find((c) => c.id === id);
}

function getCategoryLabel(id) {
  return getCategoryById(id)?.label || id;
}

function courseUrl(courseId) {
  return `course.html?id=${encodeURIComponent(courseId)}`;
}

function watchUrl(courseId, lessonId) {
  return `watch.html?course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lessonId)}`;
}

function getCourseProgress(courseId) {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  return all[courseId] || { completed: [], lastLesson: null };
}

function saveCourseProgress(courseId, data) {
  const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  all[courseId] = data;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
}

function setLastWatched(courseId, lessonId) {
  const prog = getCourseProgress(courseId);
  prog.lastLesson = lessonId;
  saveCourseProgress(courseId, prog);
  return prog;
}

function markLessonComplete(courseId, lessonId) {
  const prog = getCourseProgress(courseId);
  if (!prog.completed.includes(lessonId)) {
    prog.completed.push(lessonId);
  }
  prog.lastLesson = lessonId;
  saveCourseProgress(courseId, prog);
  return prog;
}

function getProgressPercent(course) {
  const prog = getCourseProgress(course.id);
  const total = course.lessons.length;
  if (!total) return 0;
  return Math.round((prog.completed.length / total) * 100);
}

function getCoursesInProgress() {
  return EduTube.courses
    .map((course) => {
      const prog = getCourseProgress(course.id);
      if (!prog.lastLesson && prog.completed.length === 0) return null;
      const percent = getProgressPercent(course);
      if (percent >= 100) return null;
      const last = course.lessons.find((l) => l.id === prog.lastLesson) || course.lessons[0];
      return { course, percent, lastLesson: last };
    })
    .filter(Boolean)
    .sort((a, b) => b.percent - a.percent);
}

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", stored || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(THEME_KEY, next);
}

function initNav() {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function renderCourseCard(course, options = {}) {
  const percent = getProgressPercent(course);
  const thumb = youtubeThumb(course.lessons[0]?.videoId || "");
  const lessonCount = course.lessons.length;

  return `<article class="course-card">
    <a href="${courseUrl(course.id)}">
      <img class="course-thumb" src="${thumb}" alt="" loading="lazy" width="400" height="225" />
    </a>
    <div class="course-body">
      <div class="course-meta">
        <span class="tag">${getCategoryLabel(course.category)}</span>
        <span class="tag tag--level">${course.level}</span>
      </div>
      <h3><a href="${courseUrl(course.id)}">${course.title}</a></h3>
      <p class="course-desc">${course.description}</p>
      ${percent > 0 ? `<div class="progress-bar"><div class="progress-fill" style="width:${percent}%"></div></div>` : ""}
      <div class="course-footer">
        <span>${lessonCount} lessons · ${course.instructor}</span>
        ${percent > 0 ? `<span>${percent}% done</span>` : ""}
      </div>
      ${
        options.showButton
          ? `<a href="${watchUrl(course.id, getCourseProgress(course.id).lastLesson || course.lessons[0].id)}" class="btn btn-primary btn-sm" style="margin-top:0.75rem;width:100%">Continue</a>`
          : ""
      }
    </div>
  </article>`;
}

function bindThemeToggle() {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
}

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}
