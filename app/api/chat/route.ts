import { type NextRequest, NextResponse } from "next/server"

async function callDatabricksAPI(message: string) {
  const url = "https://dbc-c6db0812-b5cc.cloud.databricks.com/serving-endpoints/Agent-op/invocations"

  const payload = {
    input: [
      {
        role: "user",
        content: message,
      },
    ],
  }

  const headers = {
    Authorization: `Bearer ${process.env.DATABRICKS_TOKEN}`,
    "Content-Type": "application/json",
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Request failed with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Databricks API Error:", error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required and must be a string" }, { status: 400 })
    }

    if (!process.env.DATABRICKS_TOKEN) {
      return NextResponse.json({ error: "DATABRICKS_TOKEN environment variable is not set" }, { status: 500 })
    }

    // Call the Databricks API
    const apiResponse = await callDatabricksAPI(message)

    let responseText = "No response received"

    if (apiResponse.output && Array.isArray(apiResponse.output)) {
      // Find the message type in the output array
      const messageOutput = apiResponse.output.find((item: any) => item.type === "message")

      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        const textContent = messageOutput.content.find(
          (item: any) => item.type === "text" || item.type === "output_text",
        )

        if (textContent) {
          // Extract text from either format
          responseText = textContent.text || textContent.output_text || "No text content found"
        }
      }
    }

    return NextResponse.json({
      response: responseText,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("API Route Error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
