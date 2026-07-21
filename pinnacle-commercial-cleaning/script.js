document.addEventListener("DOMContentLoaded", function () {
    /* ---------- Footer year ---------- */
    var yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- Sticky header ---------- */
    var header = document.getElementById("site-header");
    function updateHeader() {
        if (window.scrollY > 24) {
            header.classList.add("is-scrolled");
        } else {
            header.classList.remove("is-scrolled");
        }
    }
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    /* ---------- Mobile menu ---------- */
    var menuToggle = document.getElementById("menu-toggle");
    var mobileMenu = document.getElementById("mobile-menu");
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener("click", function () {
            mobileMenu.classList.toggle("hidden");
        });
        mobileMenu.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                mobileMenu.classList.add("hidden");
            });
        });
    }

    /* ---------- Gallery filters ---------- */
    // "All Work" shows one highlighted photo per category, not every project shot.
    // Picking a specific category (e.g. Medical Centres) reveals the full set for it.
    var filterBtns = document.querySelectorAll(".filter-btn");
    var galleryItems = document.querySelectorAll(".gallery-item");
    function applyGalleryFilter(filter) {
        galleryItems.forEach(function (item) {
            var cat = item.getAttribute("data-cat");
            var isFeatured = item.getAttribute("data-featured") === "true";
            var show = filter === "all" ? isFeatured : cat === filter;
            item.classList.toggle("is-hidden", !show);
        });
    }
    applyGalleryFilter("all");
    filterBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
            filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
            btn.classList.add("is-active");
            applyGalleryFilter(btn.getAttribute("data-filter"));
        });
    });

    /* ---------- Lightbox ---------- */
    var lightbox = document.getElementById("lightbox");
    var lightboxImg = document.getElementById("lightbox-img");
    var lightboxClose = document.getElementById("lightbox-close");
    galleryItems.forEach(function (item) {
        item.addEventListener("click", function () {
            var img = item.querySelector("img");
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightbox.classList.add("is-open");
        });
    });
    function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightboxImg.src = "";
    }
    if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
    if (lightbox) {
        lightbox.addEventListener("click", function (e) {
            if (e.target === lightbox) closeLightbox();
        });
    }
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
    });

    /* ---------- FAQ accordion ---------- */
    document.querySelectorAll(".faq-item").forEach(function (item) {
        var question = item.querySelector(".faq-question");
        var answer = item.querySelector(".faq-answer");
        question.addEventListener("click", function () {
            var isOpen = item.classList.contains("is-open");
            document.querySelectorAll(".faq-item").forEach(function (other) {
                other.classList.remove("is-open");
                other.querySelector(".faq-answer").style.maxHeight = null;
            });
            if (!isOpen) {
                item.classList.add("is-open");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    /* ---------- Contact form ---------- */
    var form = document.getElementById("quote-form");
    var formFields = document.getElementById("form-fields");
    var formSuccess = document.getElementById("form-success");
    var submitBtn = document.getElementById("form-submit-btn");

    if (form) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            var actionUrl = form.getAttribute("action") || "";
            var isConfigured = actionUrl.indexOf("YOUR_FORM_ID") === -1;

            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            if (isConfigured) {
                fetch(actionUrl, {
                    method: "POST",
                    body: new FormData(form),
                    headers: { Accept: "application/json" },
                })
                    .then(function (response) {
                        if (response.ok) {
                            showSuccess();
                        } else {
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = "1";
                            alert("Something went wrong sending your request. Please call 0413 992 060 instead.");
                        }
                    })
                    .catch(function () {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = "1";
                        alert("Something went wrong sending your request. Please call 0413 992 060 instead.");
                    });
            } else {
                /* Form endpoint not yet connected, see README for setup instructions. */
                console.warn(
                    "Pinnacle contact form: no email endpoint configured yet. Replace YOUR_FORM_ID in index.html with a real Formspree (or similar) form ID. Showing simulated success for now."
                );
                setTimeout(showSuccess, 500);
            }

            function showSuccess() {
                formFields.classList.add("hidden");
                formSuccess.classList.remove("hidden");
            }
        });
    }

    /* ---------- Reveal on scroll ---------- */
    var revealTargets = document.querySelectorAll(
        ".service-card, .trust-item, .why-item, .process-step, .team-card, .faq-item"
    );
    revealTargets.forEach(function (el) { el.setAttribute("data-reveal", ""); });

    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("is-visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12 }
        );
        revealTargets.forEach(function (el) { observer.observe(el); });
    } else {
        revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
    }
});
