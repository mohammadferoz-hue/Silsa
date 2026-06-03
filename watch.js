(function () {
  "use strict";

  function renderWatch(course, lesson) {
    document.title = `${lesson.title} — ${course.title} — EduTube`;

    const prog = getCourseProgress(course.id);
    const lessonIndex = course.lessons.findIndex((l) => l.id === lesson.id);
    const prev = course.lessons[lessonIndex - 1];
    const next = course.lessons[lessonIndex + 1];

    document.getElementById("backToCourse").href = courseUrl(course.id);

    const sidebarHtml = course.lessons
      .map((l) => {
        const active = l.id === lesson.id;
        const done = prog.completed.includes(l.id);
        return `<a href="${watchUrl(course.id, l.id)}" class="sidebar-lesson${active ? " active" : ""}${done ? " completed" : ""}">
          <span class="lesson-check">${done ? "✓" : "○"}</span>
          <div>
            <strong style="display:block;font-size:0.9rem">${l.title}</strong>
            <span style="font-size:0.8rem;color:var(--text-muted)">${l.duration}</span>
          </div>
        </a>`;
      })
      .join("");

    document.getElementById("watchMain").innerHTML = `
      <div class="watch-player-wrap">
        <div class="video-container">
          <iframe
            src="${youtubeEmbed(lesson.videoId)}"
            title="${lesson.title}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            loading="lazy"
          ></iframe>
        </div>
        <div class="watch-info">
          <div class="course-meta">
            <span class="tag">${getCategoryLabel(course.category)}</span>
            <span class="tag tag--level">${course.level}</span>
          </div>
          <h1>${lesson.title}</h1>
          <p style="color:var(--text-muted);margin:0">${course.title} · Lesson ${lessonIndex + 1} of ${course.lessons.length}</p>
          <div class="watch-actions">
            <button type="button" class="btn btn-success" id="markComplete">Mark as complete</button>
            ${prev ? `<a href="${watchUrl(course.id, prev.id)}" class="btn btn-outline btn-sm">← Previous</a>` : ""}
            ${next ? `<a href="${watchUrl(course.id, next.id)}" class="btn btn-primary btn-sm">Next →</a>` : ""}
          </div>
          <p style="font-size:0.85rem;color:var(--text-muted);margin-top:1rem">
            Video hosted on YouTube · <a href="https://www.youtube.com/watch?v=${lesson.videoId}" target="_blank" rel="noopener noreferrer">Open on YouTube</a>
          </p>
        </div>
      </div>
      <aside class="watch-sidebar">
        <h2>${course.title}</h2>
        ${sidebarHtml}
      </aside>
    `;

    const markBtn = document.getElementById("markComplete");
    const updateMarkBtn = () => {
      const p = getCourseProgress(course.id);
      if (p.completed.includes(lesson.id)) {
        markBtn.textContent = "✓ Completed";
        markBtn.disabled = true;
      }
    };
    updateMarkBtn();

    markBtn.addEventListener("click", () => {
      markLessonComplete(course.id, lesson.id);
      markBtn.textContent = "✓ Completed";
      markBtn.disabled = true;
      document.querySelectorAll(".sidebar-lesson").forEach((el, i) => {
        if (course.lessons[i].id === lesson.id) {
          el.classList.add("completed");
          el.querySelector(".lesson-check").textContent = "✓";
        }
      });
    });

    setLastWatched(course.id, lesson.id);
  }

  function showNotFound() {
    document.getElementById("watchMain").innerHTML = `
      <div class="container not-found">
        <h1>Lesson not found</h1>
        <a href="index.html" class="btn btn-primary" style="margin-top:1rem;display:inline-block">Back to home</a>
      </div>`;
  }

  async function init() {
    initTheme();
    bindThemeToggle();

    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("course");
    const lessonId = params.get("lesson");

    try {
      await loadEduTubeData();
      const course = getCourseById(courseId);
      const lesson = course?.lessons.find((l) => l.id === lessonId);

      if (course && lesson) {
        renderWatch(course, lesson);
      } else {
        showNotFound();
      }
    } catch (err) {
      document.getElementById("watchMain").innerHTML = `<p class="loading-text container">${err.message}</p>`;
    }
  }

  init();
})();
