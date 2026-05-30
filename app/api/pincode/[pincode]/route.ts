import { NextResponse } from "next/server";
import https from "https";
import { parsePincodeLookupResponse } from "@/lib/pincode/lookup";

function fetchPostalDataByPincode(pincode: string) {
  return new Promise<string>((resolve, reject) => {
    const request = https.request(
      {
        hostname: "api.postalpincode.in",
        method: "GET",
        path: `/pincode/${pincode}`,
        port: 443,
        // The postalpincode.in API currently has an expired/invalid SSL certificate.
        // We bypass it here on the server side so the frontend doesn't crash.
        rejectUnauthorized: false,
      },
      (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data);
        });
      },
    );

    request.setTimeout(15000, () => {
      request.destroy(new Error("Pincode lookup timed out."));
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.end();
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ pincode: string }> },
) {
  const { pincode: rawPincode } = await context.params;
  const pincode = String(rawPincode ?? "").replace(/\D/g, "");

  if (pincode.length !== 6) {
    return NextResponse.json(
      { error: "Invalid pincode.", success: false },
      { status: 400 },
    );
  }

  try {
    const rawResponse = await fetchPostalDataByPincode(pincode);
    const parsedPayload = JSON.parse(rawResponse);
    const lookupResult = parsePincodeLookupResponse(parsedPayload, pincode);

    return NextResponse.json(lookupResult, {
      status: lookupResult.success ? 200 : 404,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to fetch pincode details right now.",
        success: false,
      },
      { status: 500 },
    );
  }
}
