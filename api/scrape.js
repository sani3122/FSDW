export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  const targetUrl = req.query.url || "https://embed.st/embed/delta/live_uefa-nations-league-league-c-gr-3_moldova-faroe-islands-live-streaming-539465184/1/playlist.m3u8";

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Referer": "https://embed.st/",
      },
    });

    const htmlText = await response.text();

    // Search for strmd.st domains or playlist URLs in the page JS
    const strmdMatch = htmlText.match(/https?:\/\/[a-z0-9]+\.strmd\.st\/[^\s"'<>]+\.m3u8[^\s"'<>]*/i);

    if (strmdMatch) {
      return res.status(200).send(strmdMatch[0]);
    }

    // Extraction fallback: Look for token or secure path strings
    const tokenMatch = htmlText.match(/\/secure\/([a-zA-Z0-9]+)\//);
    if (tokenMatch) {
      const token = tokenMatch[1];
      const constructedLink = `https://ib4.strmd.st/secure/${token}/delta/stream/live_uefa-nations-league-league-c-gr-3_moldova-faroe-islands-live-streaming-539465184/1/playlist.m3u8`;
      return res.status(200).send(constructedLink);
    }

    // If no dynamic token matched, return raw response for debugging
    return res.status(200).send(htmlText);

  } catch (err) {
    return res.status(500).send(`Error: ${err.message}`);
  }
}
