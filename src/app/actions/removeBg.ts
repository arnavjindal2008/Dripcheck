"use server";

export async function processBackgroundRemoval(formData: FormData) {
  const apiKey = process.env.REMOVE_BG_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing REMOVE_BG_KEY in env" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    // Extract the file from FormData and convert to base64
    const file = formData.get('image_file') as File;
    if (!file) {
      return { success: false, error: "No image file provided" };
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("size", "auto");
    
    // Ensure we're sending a valid Blob/File
    const blob = new Blob([await file.arrayBuffer()], { type: file.type || 'image/png' });
    outgoingFormData.append("image_file", blob, file.name || "image.png");

    console.log("Sending request to remove.bg...");
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        // Don't set Content-Type, let fetch handle boundary
      },
      body: outgoingFormData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = "";
      try {
        const errorJson = await response.json();
        errorDetail = JSON.stringify(errorJson);
      } catch {
        errorDetail = await response.text();
      }
      console.error("Remove.bg API Error Detail:", errorDetail);
      return { success: false, error: `API Error (${response.status}): ${errorDetail}` };
    }

    const resultBlob = await response.blob();
    const arrayBuffer = await resultBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return { success: true, base64, type: resultBlob.type };
  } catch (e) {
    console.error("Background Removal Exception:", e);
    return { success: false, error: e instanceof Error ? e.message : "Internal processing error" };
  }
}
