            window.addEventListener("load", () => {
                document.documentElement.classList.add("smooth-scroll");
            });
            // Nav border + scroll progress
            const nav = document.getElementById("nav");
            const navProgress = document.getElementById("navProgress");
            let suppressScrollSpy = false;
            function onScroll() {
                const y = window.scrollY;
                nav.classList.toggle("scrolled", y > 32);
                const max = document.documentElement.scrollHeight - window.innerHeight;
                navProgress.style.width = max > 0 ? (y / max) * 100 + "%" : "0%";
                if (!suppressScrollSpy) updateActiveSection();
            }
            document.addEventListener("scroll", onScroll, { passive: true });

            // Nav wayfinding — a floating pill tracks which section is in view,
            // and locks onto Contact once you've scrolled to the bottom of the page.
            const navLinksWrap = document.querySelector(".nav-links-wrap");
            const navPill = document.getElementById("navPill");
            const sectionLinks = Array.from(document.querySelectorAll("#navLinks a[href^='#']"))
                .map((link) => ({ link, section: document.getElementById(link.getAttribute("href").slice(1)) }))
                .filter((item) => item.section);

            function setActivePill(activeLink) {
                sectionLinks.forEach(({ link }) => link.classList.toggle("active", link === activeLink));
                if (!activeLink || !navLinksWrap) {
                    navPill.style.opacity = "0";
                    return;
                }
                const linkRect = activeLink.getBoundingClientRect();
                const wrapRect = navLinksWrap.getBoundingClientRect();
                navPill.style.width = linkRect.width + "px";
                navPill.style.height = linkRect.height + "px";
                navPill.style.transform = `translate(${linkRect.left - wrapRect.left}px, ${linkRect.top - wrapRect.top}px)`;
                navPill.style.opacity = "1";
            }

            // Matches the `scroll-margin-top: calc(var(--nav-h) + 24px)` set on
            // section targets, so a clicked link's own destination immediately
            // qualifies as the active section instead of lagging one behind.
            const navHVar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 76;
            const NAV_SCROLL_OFFSET = navHVar + 25;

            // Navigates to a section and keeps correcting for it if the
            // page grows out from under the scroll mid-flight. This was
            // originally caused by the Work section's thumbnails loading
            // lazily: scrolling to Process for the first time (before
            // those images had ever entered the viewport) computed the
            // target against the Work section's shorter, pre-image-load
            // height, then the images loaded as the scroll passed over
            // them and shifted everything below out from under the
            // already-committed target. Those specific images are no
            // longer lazy-loaded for that reason (see the img tags in the
            // Work section below), which removes the repeated mid-scroll
            // corrections (and the little stutter they caused) for the
            // common case. This watcher stays in place as a safety net for
            // any other future cause of the same kind of shift.
            function navigateToSection(targetEl, animate) {
                targetEl.scrollIntoView({ behavior: animate ? "smooth" : "auto", block: "start" });
                let settleTimer = null;
                const ro = new ResizeObserver(() => {
                    targetEl.scrollIntoView({ behavior: "auto", block: "start" });
                    clearTimeout(settleTimer);
                    settleTimer = setTimeout(() => ro.disconnect(), 400);
                });
                ro.observe(document.body);
                settleTimer = setTimeout(() => ro.disconnect(), 400);
            }

            function updateActiveSection() {
                if (!sectionLinks.length) return;
                const navOffset = NAV_SCROLL_OFFSET;

                // Bottom of the page always highlights Contact, even though the
                // footer below it isn't a tracked section.
                const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
                if (atBottom) {
                    const contact = sectionLinks.find(({ section }) => section.id === "contact");
                    setActivePill(contact ? contact.link : sectionLinks[sectionLinks.length - 1].link);
                    return;
                }

                let current = null;
                for (const item of sectionLinks) {
                    if (item.section.offsetTop <= window.scrollY + navOffset) {
                        current = item.link;
                    }
                }
                setActivePill(current);
            }

            // Snap the pill to the clicked link right away, then wait for
            // scrolling to actually finish before letting live scroll-spy
            // take back over. A fixed timeout can't know how long a smooth
            // scroll to a far-down section will take, if it fires early,
            // scroll-spy briefly recalculates against a mid-flight scrollY
            // that still matches an earlier section, flashing the pill back
            // before the scroll finishes and corrects it (or, worse, getting
            // torn down mid-flight and never recalculating again).
            // Polls actual scroll position every animation frame rather than
            // guessing from the "scroll" event's dispatch timing — a native
            // smooth-scroll animation doesn't reliably fire scroll events on
            // any fixed cadence (they can be sparse/coalesced), so a timer
            // driven by event timing can win the race and lock in a
            // mid-flight section before the scroll (or corrective events)
            // ever arrive. Sampling scrollY directly every frame can't miss.
            let cancelPendingReengage = null;
            function reengageScrollSpyWhenSettled() {
                // Clicking a second link before the first scroll settles
                // must cancel the first watcher, otherwise its stale
                // finish() can fire later and fight with the new target.
                if (cancelPendingReengage) cancelPendingReengage();

                const STABLE_FRAMES_NEEDED = 8; // ~130ms of no movement at 60fps
                let lastY = window.scrollY;
                let stableFrames = 0;
                let rafId = null;
                const maxTimer = setTimeout(finish, 3000);

                function cleanup() {
                    clearTimeout(maxTimer);
                    if (rafId !== null) cancelAnimationFrame(rafId);
                    cancelPendingReengage = null;
                }
                function finish() {
                    cleanup();
                    suppressScrollSpy = false;
                    updateActiveSection();
                }
                function tick() {
                    const y = window.scrollY;
                    if (Math.abs(y - lastY) < 0.5) {
                        stableFrames++;
                        if (stableFrames >= STABLE_FRAMES_NEEDED) {
                            finish();
                            return;
                        }
                    } else {
                        stableFrames = 0;
                        lastY = y;
                    }
                    rafId = requestAnimationFrame(tick);
                }

                cancelPendingReengage = cleanup;
                rafId = requestAnimationFrame(tick);
            }

            sectionLinks.forEach(({ link, section }) => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    setActivePill(link);
                    suppressScrollSpy = true;
                    history.pushState(null, "", "#" + section.id);
                    navigateToSection(section, true);
                    reengageScrollSpyWhenSettled();
                });
            });
            window.addEventListener("resize", () => {
                if (!suppressScrollSpy) updateActiveSection();
            });

            // Arriving via a cross-page hash link (e.g. a case study's "My
            // Process" link) trusts the hash directly for the initial active
            // state instead of computing it from scroll position, which can
            // be briefly wrong while lazy-loaded images are still settling
            // and shifting section offsets, causing the pill to flicker. It
            // also re-corrects the browser's own native (and similarly
            // shift-prone) landing scroll, for the same reason
            // navigateToSection exists above.
            const initialHash = window.location.hash.slice(1);
            const initialMatch = sectionLinks.find(({ section }) => section.id === initialHash);
            if (initialMatch) {
                setActivePill(initialMatch.link);
                suppressScrollSpy = true;
                window.addEventListener("load", () => {
                    navigateToSection(initialMatch.section, false);
                    reengageScrollSpyWhenSettled();
                });
            }
            onScroll();

            // "Ask AI about me" — deep-links to ChatGPT/Claude/Perplexity
            // with a prefilled prompt pointing them at the live site + LinkedIn.
            (function initAskAi() {
                const ASK_AI_PROMPT =
                    "Search the web and tell me about Gary Engel, a User Experience Design Leader at Scentsy in Meridian, Idaho. His portfolio is https://garyengeldesign.com and his LinkedIn is linkedin.com/in/garyengel. Summarize his background, notable projects, and design process.";
                const ENGINE_URLS = {
                    chatgpt: (q) => `https://chatgpt.com/?q=${q}`,
                    claude: (q) => `https://claude.ai/new?q=${q}`,
                    perplexity: (q) => `https://www.perplexity.ai/search?q=${q}`,
                };
                const encoded = encodeURIComponent(ASK_AI_PROMPT);
                document.querySelectorAll(".ask-ai-item[data-engine]").forEach((a) => {
                    const build = ENGINE_URLS[a.dataset.engine];
                    if (build) a.href = build(encoded);
                });

                const askBtn = document.getElementById("askAiBtn");
                const askMenu = document.getElementById("askAiMenu");
                if (!askBtn || !askMenu) return;

                function closeMenu() {
                    askMenu.classList.remove("open");
                    askMenu.setAttribute("aria-hidden", "true");
                    askBtn.setAttribute("aria-expanded", "false");
                }
                function openMenu() {
                    const r = askBtn.getBoundingClientRect();
                    askMenu.style.top = r.bottom + 10 + "px";
                    askMenu.style.right = window.innerWidth - r.right + "px";
                    askMenu.classList.add("open");
                    askMenu.setAttribute("aria-hidden", "false");
                    askBtn.setAttribute("aria-expanded", "true");
                }
                askBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    askMenu.classList.contains("open") ? closeMenu() : openMenu();
                });
                document.addEventListener("click", (e) => {
                    if (!askMenu.contains(e.target) && e.target !== askBtn) closeMenu();
                });
                document.addEventListener("keydown", (e) => {
                    if (e.key === "Escape") closeMenu();
                });
                document.addEventListener("scroll", closeMenu, { passive: true });
            })();

            // Scroll-reveal
            const revealEls = document.querySelectorAll(".reveal");
            const io = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("in");
                            io.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
            );
            revealEls.forEach((el) => io.observe(el));
