import { NextResponse } from "next/server";

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>AppNormal Preview</title>
      <style>
        body {
          background: #000;
          color: white;
          font-family: sans-serif;
          padding: 20px;
        }
      </style>
    </head>
    <body>
      <h1>App Preview</h1>
      <p>This is the live preview area. Your generated app will render here.</p>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" }
  });
}
