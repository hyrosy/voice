export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";

  // Check if it's a Custom Domain OR a /pro/ link
  const isCustomDomain =
    !host.includes("ucpmaroc.com") && !host.includes("localhost");
  const slug = url.searchParams.get("slug");

  // YOUR SUPABASE KEYS (Vercel will inject these from your Environment Variables)
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  let queryUrl = "";
  if (isCustomDomain) {
    queryUrl = `${SUPABASE_URL}/rest/v1/portfolios?custom_domain=eq.${host}&select=site_name,public_slug,theme_config&limit=1`;
  } else if (slug) {
    queryUrl = `${SUPABASE_URL}/rest/v1/portfolios?public_slug=eq.${slug}&select=site_name,public_slug,theme_config&limit=1`;
  }

  // Fallbacks
  let siteName = "Actor Portfolio";
  let ogImage = "https://ucpmaroc.com/default-og.png";

  // Fast fetch from Supabase
  if (queryUrl) {
    try {
      const response = await fetch(queryUrl, {
        headers: {
          apikey: SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
        },
      });
      const data = await response.json();

      if (data && data.length > 0) {
        siteName = data[0].site_name || siteName;
        if (data[0].theme_config?.ogImage) {
          ogImage = data[0].theme_config.ogImage;
        }
      }
    } catch (err) {
      console.error("Edge Fetch Error:", err);
    }
  }

  // Return the raw HTML shell with the injected tags
  const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          <title>${siteName}</title>
          <meta property="og:title" content="${siteName}" />
          <meta property="og:description" content="Check out my professional portfolio and services." />
          <meta property="og:image" content="${ogImage}" />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
          
          <script type="module" crossorigin src="/assets/index.js"></script>
          <link rel="stylesheet" crossorigin href="/assets/index.css">
        </head>
        <body>
          <div id="root"></div>
        </body>
      </html>
    `;

  // 🚀 EDGE CACHING HEADERS: Load the site in 50ms globally
  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
