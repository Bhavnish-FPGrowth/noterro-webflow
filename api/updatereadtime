import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { _id, collectionId } = req.body; // Webflow webhook payload
    console.log("Webhook received for item:", _id);

    const apiKey = process.env.WEBFLOW_API_TOKEN;

    // Step 1: Fetch the blog item from Webflow
    const itemRes = await axios.get(
      `https://api.webflow.com/v2/collections/${collectionId}/items/${_id}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const blog = itemRes.data;
    const richText = blog.fieldData?.content || ""; // Replace "content" with your Rich Text slug

    // Step 2: Calculate read time
    const wordsPerMinute = 200;
    const words = richText.replace(/<[^>]+>/g, "").trim().split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(words / wordsPerMinute));

    console.log(`Calculated read time: ${readTime} minutes`);

    // Step 3: Update item back in Webflow
    const updateRes = await axios.patch(
      `https://api.webflow.com/v2/collections/${collectionId}/items/${_id}`,
      {
        fieldData: {
          ...blog.fieldData,
          readTime: readTime, // Replace with your CMS field slug
        },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Item updated:", updateRes.data);

    return res.status(200).json({ success: true, readTime });
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
