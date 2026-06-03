(function () {
  "use strict";

  async function renderCourse(course) {
    document.title = `${course.title} — EduTube`;

    const percent = getProgressPercent(course);
    const thumb = youtubeThumb(course.lessons[0]?.videoId);
    const firstLesson = course.lessons[0];
    const prog = getCourseProgress(course.id);
    const startLesson = prog.lastLesson || firstLesson?.id;

    const lessonsHtml = course.lessons
      .map((lesson, i) => {
        const done = prog.completed.includes(lesson.id);
        return `<a href="${watchUrl(course.id, lesson.id)}" class="lesson-item${done ? " completed" : ""}">
          <span class="lesson-num">${done ? "✓" : i + 1}</span>
          <div class="lesson-info">
            <h3>${lesson.title}</h3>
            <span>${lesson.duration}</span>
          </div>
          <span aria-hidden="true">▶</span>
        </a>`;
      })
      .join("");

    document.getElementById("courseMain").innerHTML = `
      <nav class="breadcrumb" style="margin-bottom:1rem;font-size:0.9rem;color:var(--text-muted)">
        <a href="index.html">Home</a> / <a href="index.html?category=${course.category}">${getCategoryLabel(course.category)}</a> / ${course.title}
      </nav>
      <div class="course-hero">
        <img src="${thumb}" alt="" width="640" height="360" />
        <div class="course-hero-info">
          <div class="course-meta">
            <span class="tag">${getCategoryLabel(course.category)}</span>
            <span class="tag tag--level">${course.level}</span>
          </div>
          <h1>${course.title}</h1>
          <p>${course.description}</p>
          <p style="color:var(--text-muted);font-size:0.9rem">Instructor: <strong>${course.instructor}</strong> · ${course.lessons.length} lessons</p>
          ${percent > 0 ? `<div class="progress-bar" style="margin:1rem 0"><div class="progress-fill" style="width:${percent}%"></div></div><p style="font-size:0.85rem;color:var(--text-muted)">${percent}% complete</p>` : ""}
          <a href="${watchUrl(course.id, startLesson)}" class="btn btn-primary" style="margin-top:1rem;width:fit-content">
            ${percent > 0 ? "Continue course" : "Start course"}
          </a>
        </div>
      </div>
      <div class="lesson-list">
        <h2>Course content</h2>
        ${lessonsHtml}
      </div>
    `;
  }

  function showNotFound() {
    document.getElementById("courseMain").innerHTML = `
      <div class="not-found">
        <h1>Course not found</h1>
        <p>This course does not exist in <code>data/courses.json</code>.</p>
        <a href="index.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Back to home</a>
      </div>`;
  }

  async function init() {
    initTheme();
    initNav();
    bindThemeToggle();
    setYear();

    const id = new URLSearchParams(window.location.search).get("id");

    try {
      await loadEduTubeData();
      const course = getCourseById(id);
      if (course) renderCourse(course);
      else showNotFound();
    } catch (err) {
      document.getElementById("courseMain").innerHTML = `<p class="loading-text">${err.message}</p>`;
    }
  }

  init();
})();
