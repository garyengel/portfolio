            window.addEventListener("load", () => {
                document.documentElement.classList.add("smooth-scroll");
            });
            // Nav border + scroll progress
            const nav = document.getElementById("nav");
            const navProgress = document.getElementById("navProgress");
            function onScroll() {
                const y = window.scrollY;
                nav.classList.toggle("scrolled", y > 32);
                const max = document.documentElement.scrollHeight - window.innerHeight;
                navProgress.style.width = max > 0 ? (y / max) * 100 + "%" : "0%";
            }
            document.addEventListener("scroll", onScroll, { passive: true });
            onScroll();

            // Nav wayfinding — case study pages don't have the homepage's
            // sections to scroll-spy against, so the pill just sits under
            // the permanently-active "Case Studies" link.
            (function initNavPill() {
                const navLinksWrap = document.querySelector(".nav-links-wrap");
                const navPill = document.getElementById("navPill");
                const activeLink = document.querySelector("#navLinks a.active");
                if (!navLinksWrap || !navPill || !activeLink) return;
                function positionPill() {
                    const linkRect = activeLink.getBoundingClientRect();
                    const wrapRect = navLinksWrap.getBoundingClientRect();
                    navPill.style.width = linkRect.width + "px";
                    navPill.style.height = linkRect.height + "px";
                    navPill.style.transform = `translate(${linkRect.left - wrapRect.left}px, ${linkRect.top - wrapRect.top}px)`;
                    navPill.style.opacity = "1";
                }
                positionPill();
                window.addEventListener("resize", positionPill);
            })();

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
                { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
            );
            revealEls.forEach((el) => io.observe(el));
