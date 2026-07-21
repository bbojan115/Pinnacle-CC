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

                    if (!window.opener) {
                        statusEl.textContent =
                            "Sign-in succeeded, but this tab lost its connection back to the CMS tab " +
                            "(a browser security behavior GitHub's login page triggers). " +
                            "Please close this tab and try logging in again — if it keeps happening, " +
                            "try a different browser or disable strict tracking-protection for this site.";
                        return;
                    }

                    var pingInterval;

                    function receiveMessage(e) {
                        window.opener.postMessage(
                            'authorization:github:success:${payload}',
                            e.origin
                        );
                        window.removeEventListener("message", receiveMessage, false);
                        clearInterval(pingInterval);
                        statusEl.textContent = "Signed in — you can close this tab.";
                    }
                    window.addEventListener("message", receiveMessage, false);

                    // Keep pinging the CMS tab until it replies, in case this
                    // fires before that tab has finished attaching its listener.
                    pingInterval = setInterval(function () {
                        window.opener.postMessage("authorizing:github", "*");
                    }, 100);
                })();
            </script>
            </body></html>
        `);
    } catch (err) {
        res.status(500).send("Authentication failed: " + err.message);
    }
};
