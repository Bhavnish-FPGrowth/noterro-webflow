export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { query } = req.query;
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

    console.log("RAW Webflow response:", data);

    let filtered = data.items;

    if (query && query.trim() !== "") {
      filtered = data.items.filter((item) => {
        const title = item.name || item.title || item.slug || "";
        return title.toLowerCase().includes(query.toLowerCase());
      });
    }

    const posts = filtered.map((item) => {
      const title = item.name || item.title || "Untitled";
      const slug = item.slug || "#";

      // ✅ Rich Text "Content" field
      const text = item["content"] || "";

      // remove HTML tags and count words
      const words = text.replace(/<[^>]+>/g, "").split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(words / 200)); // 200 words per min

      return {
        title,
        slug,
        readTime,
      };
    });

    res.status(200).json({ items: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
