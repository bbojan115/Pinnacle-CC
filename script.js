document.addEventListener("DOMContentLoaded", function () {
    loadContent().finally(initPage);
});

/* ---------- Content loading (drives the CMS-editable text/images) ---------- */
var siteContent = null;

function loadContent() {
    return fetch("content.json", { cache: "no-store" })
        .then(function (res) {
            if (!res.ok) throw new Error("content.json not found");
            return res.json();
        })
        .then(function (data) {
            siteContent = data;
            applyTextFields(data);
            applyImageFields(data);
            applyTelFields(data);
            applyMailtoFields(data);
            applyWhatsappFields(data);
            renderGallery(data.gallery || []);
            updateSchema(data);
        })
        .catch(function (err) {
            console.warn("Pinnacle content.json failed to load, page falls back to its static HTML content.", err);
        });
}

function getByPath(obj, path) {
    return path.split(".").reduce(function (acc, key) {
        return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
}

function applyTextFields(data) {
    document.querySelectorAll("[data-cms]").forEach(function (el) {
        var value = getByPath(data, el.getAttribute("data-cms"));
        if (value !== undefined) el.textContent = value;
    });
}

function applyImageFields(data) {
    document.querySelectorAll("[data-cms-img]").forEach(function (el) {
        var value = getByPath(data, el.getAttribute("data-cms-img"));
        if (value !== undefined) el.src = value;
    });
}

function applyTelFields(data) {
    document.querySelectorAll("[data-cms-tel]").forEach(function (el) {
        var value = getByPath(data, el.getAttribute("data-cms-tel"));
        if (value !== undefined) el.href = "tel:" + value;
    });
}

function applyMailtoFields(data) {
    document.querySelectorAll("[data-cms-mailto]").forEach(function (el) {
        var value = getByPath(data, el.getAttribute("data-cms-mailto"));
        if (value !== undefined) el.href = "mailto:" + value;
    });
}

function applyWhatsappFields(data) {
    document.querySelectorAll("[data-cms-wa]").forEach(function (el) {
        var value = getByPath(data, el.getAttribute("data-cms-wa"));
        if (value !== undefined) el.href = "https://wa.me/" + value;
    });
}

function renderGallery(items) {
    var grid = document.getElementById("gallery-grid");
    if (!grid || !items.length) return;

    grid.innerHTML = items
        .map(function (item) {
            return (
                '<div class="gallery-item" data-cat="' + item.category + '"' +
                (item.featured ? ' data-featured="true"' : "") + ">" +
                '<img src="' + item.image + '" alt="' + item.alt + '" loading="lazy" />' +
                '<span class="gallery-tag">' + item.tag + "</span>" +
                "</div>"
            );
        })
        .join("");
}

function updateSchema(data) {
    var schemaEl = document.getElementById("ld-schema");
    if (!schemaEl) return;
    try {
        var schema = JSON.parse(schemaEl.textContent);
        if (data.contact) {
            if (data.contact.phone_tel) schema.telephone = data.contact.phone_tel;
            if (data.contact.email) schema.email = data.contact.email;
        }
        schemaEl.textContent = JSON.stringify(schema);
    } catch (e) {
        console.warn("Could not update structured data with CMS content.", e);
    }
}

/* ---------- Everything else runs once the content above is in place ---------- */
function initPage() {
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
            var fallbackPhone = (siteContent && siteContent.contact && siteContent.contact.phone_display) || "1800 997 157";

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
                            alert("Something went wrong sending your request. Please call " + fallbackPhone + " instead.");
                        }
                    })
                    .catch(function () {
                        submitBtn.disabled = false;
                        submitBtn.style.opacity = "1";
                        alert("Something went wrong sending your request. Please call " + fallbackPhone + " instead.");
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
}
