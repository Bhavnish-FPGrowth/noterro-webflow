export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { _id, collectionId } = req.body;
    const apiKey = process.env.WEBFLOW_API_TOKEN;

    // Step 1: Fetch item
    const itemRes = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}/items/${_id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!itemRes.ok) throw new Error("Failed to fetch item");
    const blog = await itemRes.json();

    // Step 2: Calculate read time
    const richText = blog.fieldData?.content || ""; // 👈 Replace 'content' with your Rich Text field slug
    const words = richText.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    // Step 3: Update CMS item
    const updateRes = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}/items/${_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldData: {
            ...blog.fieldData,
            "read-time": readTime // 👈 Replace with your custom field slug
          },
        }),
      }
    );

    if (!updateRes.ok) throw new Error("Failed to update item");
    const updated = await updateRes.json();

    return res.status(200).json({ success: true, readTime, updated });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
