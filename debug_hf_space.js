
import { Client } from "@gradio/client";
import fs from 'fs';

async function test() {
    console.log("🚀 Connecting to Space...");
    try {
        const client = await Client.connect("sharry121/ImagePro");

        console.log("🔍 API INFO:");
        const api_info = await client.view_api();
        // console.log(JSON.stringify(api_info, null, 2));

        // return;

        // Load a test file
        // We need a blob or file object. In node, we can stick to URLs or fetch.
        // Let's use a dummy image buffer or fetch one.
        console.log("📸 Fetching test image...");
        const response = await fetch("https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png");
        const blob = await response.blob();

        console.log("✅ Blob created:", blob.size);

        // Parameters matching app.py input components
        // 0: input_gallery (List of files)
        // 1: face_model (value='GFPGANv1.4.pth')
        // 2: upscale_model (value='SRVGG...')
        // 3: upscale_scale (4)
        // 4: face_detection ('retinaface_resnet50')
        // 5: threshold (10)
        // 6: only_center (False)
        // 7: with_model_name (True)
        // 8: save_as_png (True)

        const result = await client.predict("/inference", [
            [blob],                 // input_gallery
            "CodeFormer.pth",       // face_model
            null,                   // upscale_model (null passed as None)
            2,                      // scale
            "retinaface_resnet50",  // detection
            10,                     // thresh
            false,                  // center
            false,                  // name
            true,                   // png
        ]);

        console.log("✅ RAW RESULT:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("❌ Error:", e);
    }
}

test();
