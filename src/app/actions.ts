"use server";

export async function processBackgroundRemoval(formData: FormData) {
  const apiKey = process.env.REMOVE_BG_KEY;
  if (!apiKey) {
    return { success: false, error: "Missing REMOVE_BG_KEY in env" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log("BG STATUS:", response.status);

    if (!response.ok) {
      return { success: false, error: "API failed with status " + response.status };
    }

    const blob = await response.blob();
    console.log("BLOB TYPE:", blob.type);
    
    if (!blob.type.includes('image/png')) {
      return { success: false, error: "Invalid format returned" };
    }

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    
    return { success: true, base64, type: blob.type };
  } catch (e) {
    console.log("BG EXCEPTION:", e);
    return { success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
