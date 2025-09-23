export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Webhook payload:", req.body);

    // Webflow’s webhook payload might send itemId (or id) and collectionId
    const { itemId, id, collectionId } = req.body;

    // Determine which field for the item identifier
    const item_id = itemId || id;
    if (!item_id) {
      throw new Error("Missing itemId or id in webhook payload");
    }
    if (!collectionId) {
      throw new Error("Missing collectionId in webhook payload");
    }

    const apiKey = process.env.WEBFLOW_API_TOKEN;
    if (!apiKey) {
      throw new Error("Missing Webflow API token in environment variables");
    }

    // Step 1: Fetch the item using correct Webflow CMS API
    const getUrl = `https://api.webflow.com/v2/collections/${collectionId}/items/${item_id}`;
    const getResp = await fetch(getUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "accept-version": "1.0.0",
      }
    });

    if (!getResp.ok) {
      const text = await getResp.text();
      console.error("Error fetching item:", getResp.status, text);
      throw new Error(`Failed to fetch item: HTTP ${getResp.status}`);
    }

    const blog = await getResp.json();
    // blog.fieldData should contain your fields, e.g. rich text, etc.

    // Step 2: Extract rich text content field
    // Replace "content" with your actual rich text slug
    const richText = blog.fieldData?.content || "";
    // Strip HTML tags
    const textOnly = richText.replace(/<[^>]+>/g, "");
    const words = textOnly.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    console.log(`Words count: ${words}, Read time: ${readTime} min`);

    // Step 3: Update the CMS item with the read time
    const patchUrl = `https://api.webflow.com/v2/collections/${collectionId}/items/${item_id}`;
    const patchBody = {
      fieldData: {
        ...blog.fieldData,
        "read-time": readTime   // <-- replace with your field's slug
      }
    };

    const patchResp = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "accept-version": "1.0.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(patchBody)
    });

    if (!patchResp.ok) {
      const text = await patchResp.text();
      console.error("Error updating item:", patchResp.status, text);
      throw new Error(`Failed to update item: HTTP ${patchResp.status}`);
    }

    const updatedBlog = await patchResp.json();

    return res.status(200).json({ success: true, readTime, updatedBlog });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
