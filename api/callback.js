module.exports = async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            res.status(400).send(`Authentication error: ${tokenData.error_description || tokenData.error}`);
            return;
        }

        const payload = JSON.stringify({ token: tokenData.access_token, provider: "github" });

        res.setHeader("Content-Type", "text/html");
        res.status(200).send(`
            <!doctype html>
            <html><body style="font-family: sans-serif; padding: 2rem; color: #334155;">
            <p id="status">Completing sign-in&hellip;</p>
            <script>
                (function () {
                    var statusEl = document.getElementById("status");
                    var diagEl = document.createElement("pre");
                    diagEl.style.cssText = "margin-top:1.5rem;padding:1rem;background:#f1f5f9;border-radius:8px;font-size:12px;white-space:pre-wrap;color:#475569;";
                    document.body.appendChild(diagEl);

                    function diag(label, fn) {
                        try {
                            diagEl.textContent += label + ": " + fn() + "\\n";
                        } catch (e) {
                            diagEl.textContent += label + ": THREW - " + e.name + ": " + e.message + "\\n";
                        }
                    }

                    diag("window.opener present", function () { return !!window.opener; });
                    diag("window.opener.closed", function () { return window.opener.closed; });
                    diag("window.opener.location.href", function () { return window.opener.location.href; });
                    diag("window.opener.document.title", function () { return window.opener.document.title; });
                    diag("this window's own URL", function () { return window.location.href; });

                    if (!window.opener) {
                        statusEl.textContent =
                            "Sign-in succeeded, but this tab lost its connection back to the CMS tab " +
                            "(a browser security behavior GitHub's login page triggers). " +
                            "Please close this tab and try logging in again — if it keeps happening, " +
                            "try a different browser or disable strict tracking-protection for this site.";
                        return;
                    }

                    // Rather than waiting for the CMS tab to acknowledge a "ready" ping
                    // first (which can be missed if its listener is still attaching),
                    // just broadcast the real success payload repeatedly for several
                    // seconds. Sending it before the tab is listening is harmless —
                    // the message is simply dropped — and the next attempt gets through
                    // once the listener is live. This trades a little redundancy for
                    // reliability.
                    var attempts = 0;
                    var maxAttempts = 60; // 60 x 150ms = ~9 seconds

                    var sendInterval = setInterval(function () {
                        window.opener.postMessage('authorizing:github', "*");
                        window.opener.postMessage('authorization:github:success:${payload}', "*");
                        attempts += 1;
                        if (attempts >= maxAttempts) {
                            clearInterval(sendInterval);
                            statusEl.textContent =
                                "Still waiting on the CMS tab to respond. You can close this tab " +
                                "and check whether it logged in anyway, or try again.";
                        }
                    }, 150);

                    window.addEventListener(
                        "message",
                        function () {
                            clearInterval(sendInterval);
                            statusEl.textContent = "Signed in — closing this tab automatically.";
                            setTimeout(function () {
                                window.close();
                            }, 800);
                        },
                        false
                    );
                })();
            </script>
            </body></html>
        `);
    } catch (err) {
        res.status(500).send("Authentication failed: " + err.message);
    }
};
