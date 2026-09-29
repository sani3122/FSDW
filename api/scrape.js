export default async function handler(req, res) {
  // Set CORS headers so any app or player can fetch it
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  const targetUrl = "https://embed.st/embed/delta/live_uefa-nations-league-league-c-gr-3_moldova-faroe-islands-live-streaming-539465184/1/playlist.m3u8";

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://embed.st/",
      },
    });

    if (!response.ok) {
      return res.status(response.status).send(`Error fetching source: ${response.statusText}`);
    }

    const bodyText = await response.text();

    // 1. If the target URL returns a raw M3U8 playlist directly, locate internal sub-playlists or segments
    if (bodyText.includes("#EXTM3U")) {
      const lines = bodyText.split("\n");
      const streamUrls = lines
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"));

      if (streamUrls.length > 0) {
        // Return extracted stream link(s) as plain text
        return res.status(200).send(streamUrls.join("\n"));
      }
    }

    // 2. If the URL points to an embed HTML page instead of a raw manifest, search for .m3u8 links in the HTML
    const m3u8Match = bodyText.match(/(https?:\/\/[^\s"'<>]+\.m3u8[^\s"'<>]*)/i);
    if (m3u8Match) {
      return res.status(200).send(m3u8Match[1]);
    }

    // Fallback: Output raw fetched contents if no specific pattern was matched
    return res.status(200).send(bodyText);

  } catch (error) {
    return res.status(500).send(`Scraper Error: ${error.message}`);
  }
}
