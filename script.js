/* =========================================================
   Lilac Bakery — script.js
   ========================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     1) FRESH TODAY  —  live from a Google Sheet
     ----------------------------------------------------------
     HOW THE OWNERS UPDATE IT (no code, no redeploy):
       1. Make a Google Sheet with a tab called "FreshToday".
       2. Columns (row 1 = headers):
            A: Item      e.g. "Old Granary Sourdough"
            B: Note      e.g. "£4.50"  (optional)
            C: Status    leave blank, or type "sold out" / "low"
       3. Share > General access > "Anyone with the link" = Viewer.
       4. Copy the Sheet ID from its URL:
            docs.google.com/spreadsheets/d/THIS_LONG_ID/edit
       5. Paste it into SHEET_ID below and redeploy ONCE.
          After that, edits to the sheet appear on the site
          automatically — just refresh.
     If the sheet isn't set up yet, the FALLBACK list below shows.
  ---------------------------------------------------------- */
  var SHEET_ID = "";              // <-- paste your Google Sheet ID here
  var SHEET_TAB = "FreshToday";   // tab name

  var FALLBACK = [
    { item: "Old Granary Sourdough", note: "", status: "" },
    { item: "Butter Croissants", note: "", status: "" },
    { item: "Cardamom Buns", note: "", status: "low" },
    { item: "Blackcurrant Crème Buns", note: "", status: "" },
    { item: "Kouign-Amann", note: "", status: "" },
    { item: "Brown Butter Brownies", note: "", status: "" }
  ];

  var boardEl = document.getElementById("freshToday");
  var boardDateEl = document.getElementById("boardDate");

  if (boardDateEl) {
    boardDateEl.textContent = new Date().toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short"
    });
  }

  function renderBoard(items) {
    if (!boardEl) return;
    if (!items || !items.length) { boardEl.innerHTML = '<li class="board__loading">Back baking soon.</li>'; return; }
    boardEl.innerHTML = items.map(function (row) {
      var status = (row.status || "").toString().trim().toLowerCase();
      var isOut = status === "sold out" || status === "soldout" || status === "out";
      var isLow = status === "low" || status === "few left" || status === "selling fast";
      var tag = isOut
        ? '<span class="board__tag board__tag--out">Sold out</span>'
        : isLow
          ? '<span class="board__tag board__tag--low">Selling fast</span>'
          : (row.note ? '<span class="board__item-note">' + escapeHtml(row.note) + "</span>" : "");
      return '<li class="' + (isOut ? "sold-out" : "") + '">' +
               '<span class="board__item-name">' + escapeHtml(row.item) + "</span>" + tag +
             "</li>";
    }).join("");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function loadFreshToday() {
    if (!SHEET_ID) { renderBoard(FALLBACK); return; }
    var url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
              "/gviz/tq?tqx=out:json&sheet=" + encodeURIComponent(SHEET_TAB);
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.text(); })
      .then(function (text) {
        // gviz wraps JSON in a function call — strip it.
        var json = JSON.parse(text.replace(/^[^(]*\(/, "").replace(/\);?\s*$/, ""));
        var rows = (json.table && json.table.rows) || [];
        var items = rows.map(function (r) {
          var c = r.c || [];
          return {
            item: c[0] && c[0].v != null ? c[0].v : "",
            note: c[1] && c[1].v != null ? c[1].v : "",
            status: c[2] && c[2].v != null ? c[2].v : ""
          };
        }).filter(function (x) { return x.item; });
        renderBoard(items.length ? items : FALLBACK);
      })
      .catch(function () { renderBoard(FALLBACK); });
  }
  loadFreshToday();

  /* ----------------------------------------------------------
     2) PRE-ORDER FORM  —  posts to /api/order (Vercel function)
  ---------------------------------------------------------- */
  var form = document.getElementById("orderForm");
  var statusEl = document.getElementById("formStatus");
  var submitBtn = document.getElementById("orderSubmit");

  if (form) {
    // sensible min date = today
    var dateInput = document.getElementById("date");
    if (dateInput) dateInput.min = new Date().toISOString().split("T")[0];

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.className = "form-status";

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        orderType: form.orderType.value,
        date: form.date.value,
        details: form.details.value.trim(),
        company: form.company.value // honeypot
      };

      submitBtn.setAttribute("aria-busy", "true");
      var original = submitBtn.textContent;
      submitBtn.textContent = "Sending…";

      fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) { return res.json().then(function (b) { return { ok: res.ok, body: b }; }); })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            statusEl.textContent = "Thank you! Your request is in — we'll be in touch shortly to confirm.";
            statusEl.className = "form-status ok";
          } else {
            throw new Error((r.body && r.body.error) || "Something went wrong.");
          }
        })
        .catch(function (err) {
          statusEl.textContent = "Sorry — that didn't send (" + err.message +
            "). Please email us or call instead.";
          statusEl.className = "form-status err";
        })
        .finally(function () {
          submitBtn.removeAttribute("aria-busy");
          submitBtn.textContent = original;
        });
    });
  }

  /* ----------------------------------------------------------
     3) MOBILE NAV
  ---------------------------------------------------------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");
  if (toggle && menu) {
    function closeMenu() {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    }
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    // Close on Escape, or when tapping outside the open menu.
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (menu.classList.contains("open") &&
          !menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });
  }

  /* ----------------------------------------------------------
     3b) SCROLLSPY — highlight the nav link for the section in view
  ---------------------------------------------------------- */
  if (menu && "IntersectionObserver" in window) {
    var navLinks = menu.querySelectorAll('a[href^="#"]:not(.btn)');
    var byId = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) byId[id] = a;
    });
    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);
    if (sections.length) {
      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var link = byId[entry.target.id];
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) {
              l.classList.remove("is-active");
              l.removeAttribute("aria-current");
            });
            link.classList.add("is-active");
            link.setAttribute("aria-current", "true");
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach(function (s) { spy.observe(s); });
    }
  }

  /* ----------------------------------------------------------
     4) INSTAGRAM — show Behold feed if configured, else fallback
  ---------------------------------------------------------- */
  var behold = document.getElementById("beholdFeed");
  var igFallback = document.getElementById("igFallback");
  if (behold && behold.getAttribute("data-behold-id")) {
    behold.hidden = false;
    if (igFallback) igFallback.hidden = true;
    var s = document.createElement("script");
    s.type = "module";
    s.src = "https://w.behold.so/widget.js";
    document.body.appendChild(s);
  }

  /* ----------------------------------------------------------
     5) NICETIES — year + scroll reveal
  ---------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var revealEls = document.querySelectorAll(
    ".story__copy, .story__media, .section-head, .bake, .order__intro, .order__form, .visit__info, .visit__map"
  );
  revealEls.forEach(function (el) { el.classList.add("reveal"); });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
})();
