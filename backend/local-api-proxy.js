import http from "http";
import https from "https";
import { URL } from "url";

const upstreamBase = new URL(
  process.env.UPSTREAM_API_URL || "https://elitemart.up.railway.app"
);
const port = Number(process.env.PORT || 5000);

const client = upstreamBase.protocol === "https:" ? https : http;

const server = http.createServer((req, res) => {
  if (!req.url || !req.url.startsWith("/api")) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: "Not found" }));
    return;
  }

  const requestOrigin = req.headers.origin || "http://localhost:3000";

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || "Content-Type, Authorization"
    );
    res.setHeader("Vary", "Origin");
    res.end();
    return;
  }

  const upstreamUrl = new URL(req.url, upstreamBase);
  const headers = { ...req.headers };

  delete headers.host;
  delete headers.origin;
  delete headers.referer;
  delete headers["content-length"];
  delete headers["accept-encoding"];

  headers.host = upstreamUrl.host;

  const proxyRequest = client.request(
    upstreamUrl,
    {
      method: req.method,
      headers,
    },
    (proxyResponse) => {
      const responseHeaders = { ...proxyResponse.headers };
      responseHeaders["access-control-allow-origin"] = requestOrigin;
      responseHeaders["access-control-allow-credentials"] = "true";
      responseHeaders.vary = responseHeaders.vary
        ? `${responseHeaders.vary}, Origin`
        : "Origin";

      res.writeHead(proxyResponse.statusCode || 502, responseHeaders);
      proxyResponse.pipe(res);
    }
  );

  proxyRequest.on("error", (error) => {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        message: "Local API proxy failed",
        error: error.message,
      })
    );
  });

  req.pipe(proxyRequest);
});

server.listen(port, () => {
  console.log(`Local API proxy listening on http://localhost:${port}`);
  console.log(`Forwarding API traffic to ${upstreamBase.origin}`);
});
