module.exports = (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = `https://${req.headers.host}/api/callback`;
    const authorizeUrl =
        `https://github.com/login/oauth/authorize?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;

    res.writeHead(302, { Location: authorizeUrl });
    res.end();
};
