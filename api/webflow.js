export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow Webflow to call it
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // preflight check
  }

  const { query } = req.query; // search keyword
  const collectionId = process.env.WEBFLOW_COLLECTION_ID;

  try {
    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}/items`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
          "accept-version": "1.0.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Webflow API error: ${response.status}`);
    }

    const data = await response.json();

    // filter by query (case insensitive)
    let filtered = data.items;
    if (query && query.trim() !== "") {
      filtered = data.items.filter((item) =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // attach read-time calculation
    const posts = filtered.map((item) => {
      const text = item.richText || ""; // adjust field name if different
      const words = text.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(words / 200)); // 200 wpm

      return {
        title: item.name,
        slug: item.slug,
        readTime,
      };
    });

    res.status(200).json({ items: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
