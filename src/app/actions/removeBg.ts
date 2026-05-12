"use server";

export async function processBackgroundRemoval(formData: FormData) {
  const apiKey = process.env.REMOVE_BG_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing REMOVE_BG_KEY in env" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    // Extract the file from FormData and convert to base64
    const file = formData.get('image_file') as File;
    if (!file) {
      return { success: false, error: "No image file provided" };
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("size", "auto");
    outgoingFormData.append("image_file", file, file.name || "image.png");

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey
      },
      body: outgoingFormData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API Error:", response.status, errorText);
      return { success: false, error: `API failed: ${response.status} - ${errorText}` };
    }

    const blob = await response.blob();

    if (!blob.type.includes('image/png')) {
      return { success: false, error: "Invalid format returned" };
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');

    return { success: true, base64, type: blob.type };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
