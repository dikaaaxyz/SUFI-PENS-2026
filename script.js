const navbar = document.querySelector(".navbar");
const toggler = document.getElementById("navbarToggler");
const collapse = document.getElementById("navbarCollapse");

// Samakan padding-top body dengan tinggi navbar (mirip pola fixed-top)
// supaya konten tidak ketutup saat tinggi navbar berubah di mobile.
const syncBodyPadding = () => {
  const navbarEl = document.querySelector(".navbar");
  if (!navbarEl) return;

  document.body.style.paddingTop = navbarEl.offsetHeight + "px";

  // simpan juga ke CSS var untuk dipakai scroll-margin/scroll-padding
  document.documentElement.style.setProperty(
    "--navbar-h",
    navbarEl.offsetHeight + "px"
  );

  // simpan tinggi subnav (jika ada) untuk offset anchor/scroll
  const subnavEl = document.querySelector(".ak-subnav");
  if (subnavEl) {
    document.documentElement.style.setProperty(
      "--subnav-h",
      subnavEl.offsetHeight + "px"
    );
  }
};

document.addEventListener("DOMContentLoaded", syncBodyPadding);
window.addEventListener("resize", syncBodyPadding);

if (navbar && toggler && collapse) {
  // ✅ Samakan breakpoint JS dengan CSS (@media max-width: 1020px)
  const mq = window.matchMedia("(max-width: 1020px)");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const setOpen = (open) => {
    collapse.classList.toggle("show", open);
    navbar.classList.toggle("is-open", open);
    toggler.setAttribute("aria-expanded", String(open));

    // setelah perubahan layout, pastikan padding body tetap akurat
    requestAnimationFrame(syncBodyPadding);
    setTimeout(syncBodyPadding, 280);
  };

  const waitCollapseSettle = () =>
    new Promise((resolve) => {
      if (prefersReduced.matches) return resolve();

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        collapse.removeEventListener("transitionend", onEnd);
        resolve();
      };

      const onEnd = (e) => {
        // fokus pada transisi utama agar tidak "nunggu" banyak event
        if (
          e.target === collapse &&
          (e.propertyName === "max-height" || e.propertyName === "opacity")
        ) {
          finish();
        }
      };

      collapse.addEventListener("transitionend", onEnd);
      setTimeout(finish, 520); // fallback kalau transitionend gak ke-trigger
    });

  const scrollToId = (id) => {
    const target = document.getElementById(id);
    if (!target) return;

    // scroll-margin-top + scroll-padding-top sudah diatur via CSS
    target.scrollIntoView({
      behavior: prefersReduced.matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const handleAnchorClick = async (a) => {
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("#") || href === "#") return false;

    const id = decodeURIComponent(href.slice(1));
    if (!document.getElementById(id)) return false;

    // update URL hash tanpa “jump”
    history.pushState(null, "", `#${encodeURIComponent(id)}`);

    const isMobile = mq.matches;
    const wasOpen = collapse.classList.contains("show");

    // kalau mobile & menu sedang terbuka -> tutup dulu, tunggu settle, lalu scroll
    if (isMobile && wasOpen) {
      setOpen(false);
      await waitCollapseSettle();
      syncBodyPadding();
      scrollToId(id);
    } else {
      requestAnimationFrame(() => {
        syncBodyPadding();
        scrollToId(id);
      });
    }

    return true;
  };

  toggler.addEventListener("click", (e) => {
    e.preventDefault();
    setOpen(!collapse.classList.contains("show"));
  });

  // Klik link menu (mobile/desktop) + smooth scroll ke section
  collapse.addEventListener("click", async (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;

    const handled = await handleAnchorClick(a);
    if (handled) e.preventDefault(); // cegah browser jump default
  });

  // (Opsional) Tangkap anchor yang mungkin berada di luar navbar
  document.addEventListener("click", async (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    if (collapse.contains(a)) return;

    const handled = await handleAnchorClick(a);
    if (handled) e.preventDefault();
  });

  // Tutup menu saat klik di luar navbar (mobile)
  document.addEventListener("click", (e) => {
    if (!mq.matches) return;
    if (!collapse.classList.contains("show")) return;
    if (!navbar.contains(e.target)) setOpen(false);
  });

  // Tutup menu dengan tombol Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && collapse.classList.contains("show"))
      setOpen(false);
  });

  // Kalau pindah ke desktop, pastikan menu tidak nyangkut terbuka
  window.addEventListener("resize", () => {
    if (!mq.matches) setOpen(false);
    syncBodyPadding();
  });

  // Kalau halaman dibuka langsung dengan hash (#about, dll)
  window.addEventListener("load", () => {
    if (!location.hash || location.hash === "#") return;
    const id = decodeURIComponent(location.hash.slice(1));
    if (!document.getElementById(id)) return;

    setTimeout(() => {
      syncBodyPadding();
      scrollToId(id);
    }, 0);
  });

  // init
  syncBodyPadding();
}

// === Tambahan untuk konten bawah header (mirip tugas 6) ===
(() => {
  // prevent search reload (kalau belum ada backend)
  const searchForm = document.querySelector(".navbar-search");
  if (searchForm)
    searchForm.addEventListener("submit", (e) => e.preventDefault());

  // reveal on scroll
  const els = document.querySelectorAll(".reveal");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (els.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  // Accordion
  const acc = document.querySelector(".accordion");
  if (!acc) return;

  const single = acc.dataset.accordion === "single";
  const setItemOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    const btn = item.querySelector(".acc-trigger");
    if (btn) btn.setAttribute("aria-expanded", String(open));
  };

  acc.addEventListener("click", (e) => {
    const btn = e.target.closest(".acc-trigger");
    if (!btn) return;

    const item = btn.closest(".acc-item");
    if (!item) return;

    const willOpen = !item.classList.contains("is-open");

    if (single && willOpen) {
      acc.querySelectorAll(".acc-item.is-open").forEach((other) => {
        if (other !== item) setItemOpen(other, false);
      });
    }

    setItemOpen(item, willOpen);
  });

  // Pastikan state awal sesuai aria-expanded (kalau ada item default open)
  acc.querySelectorAll(".acc-item").forEach((item) => {
    const btn = item.querySelector(".acc-trigger");
    if (!btn) return;
    const expanded = btn.getAttribute("aria-expanded") === "true";
    item.classList.toggle("is-open", expanded);
  });

  // sync padding (biar scroll offset tetap konsisten)
  if (!prefersReduced.matches) requestAnimationFrame(syncBodyPadding);
})();

/* =========================
   Gallery Slider (klikable)
   ========================= */
(function initGallerySlider() {
  const slider = document.querySelector(".gallery-slider");
  if (!slider) return;

  const viewport = slider.querySelector(".gs-viewport");
  const slides = Array.from(slider.querySelectorAll(".gs-slide"));
  const btnPrev = slider.querySelector(".gs-prev");
  const btnNext = slider.querySelector(".gs-next");
  const dotsWrap = slider.querySelector(".gs-dots");

  if (!viewport || slides.length === 0) return;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  const shouldReduce = () => !!(prefersReduced && prefersReduced.matches);

  const autoplay =
    slider.getAttribute("data-autoplay") === "true" && !shouldReduce();
  const interval = Math.max(
    2500,
    parseInt(slider.getAttribute("data-interval") || "5000", 10) || 5000
  );

  let activeIndex = 0;
  let timer = null;
  let userPaused = false;

  const scrollToIndex = (idx, smooth = true) => {
    const i = (idx + slides.length) % slides.length;
    const left = i * viewport.clientWidth;
    viewport.scrollTo({
      left,
      behavior: smooth && !shouldReduce() ? "smooth" : "auto",
    });
  };

  // Dots
  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((slide, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "gs-dot";
      const label = slide.getAttribute("aria-label") || `Slide ${i + 1}`;
      dot.setAttribute("aria-label", `Buka ${label}`);
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        userPaused = true;
        stopAutoplay();
        scrollToIndex(i, true);
      });
      dotsWrap.appendChild(dot);
    });
  }

  const dots = Array.from(slider.querySelectorAll(".gs-dot"));

  const setActive = (i) => {
    activeIndex = i;
    dots.forEach((d, di) => d.classList.toggle("is-active", di === i));
  };

  // Detect active slide (lebih akurat saat user scroll/drag)
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const idx = slides.indexOf(entry.target);
              if (idx >= 0) setActive(idx);
            });
          },
          { root: viewport, threshold: 0.6 }
        )
      : null;

  if (io) {
    slides.forEach((s) => io.observe(s));
  } else {
    // fallback: hitung berdasar scroll
    viewport.addEventListener(
      "scroll",
      () => {
        const idx = Math.round(
          viewport.scrollLeft / Math.max(1, viewport.clientWidth)
        );
        setActive(Math.min(slides.length - 1, Math.max(0, idx)));
      },
      { passive: true }
    );
  }

  // Buttons
  const onPrev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    userPaused = true;
    stopAutoplay();
    scrollToIndex(activeIndex - 1, true);
  };

  const onNext = (e) => {
    e.preventDefault();
    e.stopPropagation();
    userPaused = true;
    stopAutoplay();
    scrollToIndex(activeIndex + 1, true);
  };

  if (btnPrev) btnPrev.addEventListener("click", onPrev);
  if (btnNext) btnNext.addEventListener("click", onNext);

  // Keyboard (viewport focusable)
  viewport.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") onPrev(e);
    if (e.key === "ArrowRight") onNext(e);
  });

  // Autoplay
  const startAutoplay = () => {
    if (!autoplay || timer || userPaused) return;
    timer = setInterval(() => scrollToIndex(activeIndex + 1, true), interval);
  };

  const stopAutoplay = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  // Pause on hover/focus/touch
  const pause = () => {
    stopAutoplay();
  };
  const resume = () => {
    startAutoplay();
  };

  slider.addEventListener("mouseenter", pause);
  slider.addEventListener("mouseleave", resume);
  slider.addEventListener("focusin", pause);
  slider.addEventListener("focusout", resume);

  viewport.addEventListener(
    "pointerdown",
    () => {
      userPaused = true;
      stopAutoplay();
    },
    { passive: true }
  );

  // Keep position on resize
  window.addEventListener("resize", () => {
    scrollToIndex(activeIndex, false);
  });

  // init
  setActive(0);
  startAutoplay();
})();

// =========================
// CONTACT FAB (Floating Contact)
// =========================
(() => {
  const wrap = document.getElementById("contactFabWrap");
  const btn = document.getElementById("contactFab");
  const panel = document.getElementById("contactPanel");
  const closeBtn = document.getElementById("contactPanelClose");

  if (!wrap || !btn || !panel || !closeBtn) return;

  const firstFocusable = () =>
    panel.querySelector("a[href], button:not([disabled])");

  const open = () => {
    wrap.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    const el = firstFocusable();
    if (el) el.focus({ preventScroll: true });
  };

  const close = () => {
    wrap.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  };

  const toggle = () => {
    if (wrap.classList.contains("is-open")) close();
    else open();
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggle();
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
    btn.focus({ preventScroll: true });
  });

  // Close if click outside
  document.addEventListener("click", (e) => {
    if (!wrap.classList.contains("is-open")) return;
    if (!wrap.contains(e.target)) close();
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!wrap.classList.contains("is-open")) return;
    close();
    btn.focus({ preventScroll: true });
  });
})();

// Open Contact Panel from anywhere (e.g., footer button)
(() => {
  const btn = document.getElementById("contactFab");
  const wrap = document.getElementById("contactFabWrap");
  const panel = document.getElementById("contactPanel");
  if (!btn || !wrap) return;

  document.querySelectorAll("[data-open-contact]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (!wrap.classList.contains("is-open")) btn.click();
      // focus first link inside the panel (optional)
      if (panel) {
        const first = panel.querySelector("a[href], button:not([disabled])");
        if (first) first.focus({ preventScroll: true });
      }
    });
  });
})();

/* === AKADEMIK PICO ENHANCEMENTS:START === */
/* Akademik (PICO) enhancements - safe to load alongside script.js */
(function () {
  // Jalankan hanya di halaman Akademik
  if (!document.body || !document.body.classList.contains("akd-page")) return;
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

  // Scroll progress
  const progress = qs("#scrollProgress");
  const backToTop = qs("#backToTop");

  const navEl = document.querySelector(".navbar");
  const updateNavScrolled = () => {
    if (!navEl) return;
    const y = window.pageYOffset || 0;
    navEl.classList.toggle("is-scrolled", y > 8);
  };

  const updateProgress = () => {
    if (!progress) return;
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || 0;
    const max = doc.scrollHeight - window.innerHeight || 1;
    const pct = Math.max(0, Math.min(1, scrollTop / max));
    progress.style.width = (pct * 100).toFixed(2) + "%";
  };

  const updateBackToTop = () => {
    if (!backToTop) return;
    const y = window.pageYOffset || 0;
    backToTop.classList.toggle("is-visible", y > 480);
  };

  window.addEventListener(
    "scroll",
    () => {
      updateProgress();
      updateBackToTop();
      updateNavScrolled();
    },
    { passive: true }
  );

  window.addEventListener("load", () => {
    updateProgress();
    updateBackToTop();
    updateNavScrolled();
  });

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Copy to clipboard
  qsa("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(text);
        const prev = btn.innerHTML;
        btn.innerHTML =
          '<i class="bi bi-check2" aria-hidden="true"></i> Tersalin';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = prev;
          btn.disabled = false;
        }, 1400);
      } catch (e) {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy");
        } catch (_) {}
        document.body.removeChild(ta);
      }
    });
  });

  // Accordion (accessible)
  qsa("[data-accordion] .ak-acc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!expanded));
      const panel = btn.parentElement?.querySelector(".ak-acc-panel");
      if (!panel) return;
      panel.hidden = expanded;
    });
  });

  // Scrollspy for toc + subnav
  const spyLinks = qsa("[data-spy-link], .ak-toc-link");
  const targets = spyLinks
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && h.startsWith("#"))
    .map((h) => qs(h))
    .filter(Boolean);

  if (targets.length) {
    const mapIdToLinks = new Map();
    spyLinks.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || !href.startsWith("#")) return;
      const id = href.slice(1);
      const arr = mapIdToLinks.get(id) || [];
      arr.push(a);
      mapIdToLinks.set(id, arr);
    });

    const setActive = (id) => {
      // clear
      mapIdToLinks.forEach((arr) =>
        arr.forEach((a) => a.classList.remove("is-active"))
      );
      const arr = mapIdToLinks.get(id);
      if (arr) arr.forEach((a) => a.classList.add("is-active"));
    };

    const obs = new IntersectionObserver(
      (entries) => {
        // pick most visible
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0)
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.5, 0.65, 0.8],
        rootMargin: "-20% 0px -65% 0px",
      }
    );

    targets.forEach((t) => obs.observe(t));
  }

  // Smooth scroll for anchor links (keep focus)
  qsa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = qs(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => target.setAttribute("tabindex", "-1"), 0);
      setTimeout(() => target.focus({ preventScroll: true }), 350);
      setTimeout(() => target.removeAttribute("tabindex"), 1200);
      history.pushState(null, "", href);
    });
  });

  // Animated counters for KPI
  const counters = qsa("[data-count]");
  if (counters.length) {
    const animate = (el) => {
      const target = parseInt(el.getAttribute("data-count") || "0", 10);
      const start = 0;
      const dur = 650;
      const t0 = performance.now();

      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const val = Math.round(
          start + (target - start) * (1 - Math.pow(1 - p, 3))
        );
        el.textContent = String(val);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          if (el.dataset.done) return;
          el.dataset.done = "1";
          animate(el);
        });
      },
      { threshold: 0.6 }
    );

    counters.forEach((c) => cObs.observe(c));
  }

  // Utility: remove previous highlights
  const clearHighlights = (cell) => {
    qsa(".ak-mark", cell).forEach((m) => {
      const text = document.createTextNode(m.textContent || "");
      m.replaceWith(text);
    });
  };

  const highlightCell = (cell, query) => {
    clearHighlights(cell);
    if (!query) return;
    const text = cell.textContent || "";
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return;

    const before = document.createTextNode(text.slice(0, idx));
    const mark = document.createElement("span");
    mark.className = "ak-mark";
    mark.textContent = text.slice(idx, idx + query.length);
    const after = document.createTextNode(text.slice(idx + query.length));

    // replace all children
    cell.textContent = "";
    cell.appendChild(before);
    cell.appendChild(mark);
    cell.appendChild(after);
  };

  // Partner table filters
  const partnerTable = qs("#partnerTable");
  const partnerSearch = qs("#partnerSearch");
  const partnerCountry = qs("#partnerCountry");
  const partnerType = qs("#partnerType");
  const partnerCount = qs("#partnerCount");

  const partnerRows = partnerTable ? qsa("tbody tr", partnerTable) : [];

  const populateCountries = () => {
    if (!partnerCountry || !partnerRows.length) return;
    const set = new Set(
      partnerRows.map((r) => (r.dataset.country || "").trim()).filter(Boolean)
    );
    const countries = Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
    countries.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      partnerCountry.appendChild(opt);
    });
  };

  const applyPartnerFilter = () => {
    if (!partnerRows.length) return;
    const q = (partnerSearch?.value || "").trim().toLowerCase();
    const c = partnerCountry?.value || "all";
    const t = partnerType?.value || "all";
    let shown = 0;

    partnerRows.forEach((row) => {
      const country = (row.dataset.country || "").trim();
      const type = (row.dataset.type || "").trim();
      const instCell = row.children?.[1]; // Institution
      const hay = (row.textContent || "").toLowerCase();

      // highlight only institution cell
      if (instCell) highlightCell(instCell, q);

      const okQ = !q || hay.includes(q);
      const okC = c === "all" || country === c;
      const okT = t === "all" || type === t;

      const ok = okQ && okC && okT;
      row.style.display = ok ? "" : "none";
      if (ok) shown += 1;
    });

    if (partnerCount) partnerCount.textContent = String(shown);
  };

  if (partnerRows.length) {
    populateCountries();
    applyPartnerFilter();
    [partnerSearch, partnerCountry, partnerType]
      .filter(Boolean)
      .forEach((el) => {
        el.addEventListener("input", applyPartnerFilter);
        el.addEventListener("change", applyPartnerFilter);
      });
  }

  // Program Studi table search (simple)
  const prodiSearch = qs("#prodiSearch");
  const prodiCount = qs("#prodiCount");
  const prodiTable = qs("#program-studi table");
  const prodiRows = prodiTable ? qsa("tbody tr", prodiTable) : [];

  const applyProdiFilter = () => {
    if (!prodiRows.length) return;
    const q = (prodiSearch?.value || "").trim().toLowerCase();
    let shown = 0;
    prodiRows.forEach((row) => {
      const hay = (row.textContent || "").toLowerCase();
      const ok = !q || hay.includes(q);
      row.style.display = ok ? "" : "none";
      if (ok) shown += 1;
    });
    if (prodiCount) prodiCount.textContent = String(shown);
  };

  if (prodiRows.length) {
    applyProdiFilter();
    if (prodiSearch) prodiSearch.addEventListener("input", applyProdiFilter);
  }
})();
/* === AKADEMIK PICO ENHANCEMENTS:END === */
