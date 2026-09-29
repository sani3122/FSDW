export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Get the target stream URL dynamically from query parameter
  // Example: https://ddada-seven.vercel.app/playlist.txt?url=HTTPS_TARGET_URL
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send("Error: Please provide a 'url' query parameter. Example: /playlist.txt?url=https://example.com/stream.m3u8");
  }

  try {
    const parsedUrl = new URL(targetUrl);

    const response = await fetch(parsedUrl.href, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": `${parsedUrl.protocol}//${parsedUrl.hostname}/`,
        "Origin": `${parsedUrl.protocol}//${parsedUrl.hostname}`,
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Error fetching source: ${response.statusText} (HTTP ${response.status})`);
    }

    const bodyText = await response.text();

    // 1. If response is a direct M3U/M3U8 playlist
    if (bodyText.includes("#EXTM3U")) {
      const baseUrl = parsedUrl.href.substring(0, parsedUrl.href.lastIndexOf("/") + 1);
      const lines = bodyText.split("\n");

      const streamUrls = lines
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
          try {
            return new URL(line, baseUrl).href;
          } catch (e) {
            return line;
          }
        });

      if (streamUrls.length > 0) {
        return res.status(200).send(streamUrls.join("\n"));
      }
    }

    // 2. If response is an embed HTML page, extract nested m3u8 URLs
    const m3u8Matches = bodyText.match(/https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*/gi);
    if (m3u8Matches && m3u8Matches.length > 0) {
      return res.status(200).send([...new Set(m3u8Matches)].join("\n"));
    }

    // Fallback: return raw body if no playlist lines matched
    return res.status(200).send(bodyText);

  } catch (error) {
    return res.status(500).send(`Scraper Error: ${error.message}`);
  }
}
