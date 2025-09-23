export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Webhook payload:", req.body);

    // Extract payload from Webflow webhook
    const webhookPayload = req.body.payload;
    if (!webhookPayload) throw new Error("Missing webhook payload");

    const itemId = webhookPayload.id;
    const collectionId = webhookPayload.collectionId;

    if (!itemId) throw new Error("Missing itemId in webhook payload");
    if (!collectionId) throw new Error("Missing collectionId in webhook payload");

    const apiKey = process.env.WEBFLOW_API_TOKEN;
    if (!apiKey) throw new Error("Missing Webflow API token in env variables");

    // Step 1: Fetch item
    const getUrl = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
    const getResp = await fetch(getUrl, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "accept-version": "1.0.0"
      }
    });

    if (!getResp.ok) {
      const text = await getResp.text();
      console.error("Error fetching item:", getResp.status, text);
      throw new Error(`Failed to fetch item: HTTP ${getResp.status}`);
    }

    const blog = await getResp.json();

    // Step 2: Calculate read time
    const richText = blog.fieldData?.content || ""; // replace with your rich text field slug
    const words = richText.replace(/<[^>]+>/g, "").trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    console.log(`Words count: ${words}, Read time: ${readTime} min`);

    // Step 3: Update CMS item
    const patchUrl = `https://api.webflow.com/v2/collections/${collectionId}/items/${itemId}`;
    const patchResp = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "accept-version": "1.0.0",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fieldData: {
          ...blog.fieldData,
          "read-time": readTime // replace with your read-time field slug
        }
      })
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
