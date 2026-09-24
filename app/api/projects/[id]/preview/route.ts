import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    // Find main HTML file
    let htmlFile = project.files.find((f) => f.path.toLowerCase() === "index.html");
    if (!htmlFile) {
      htmlFile = project.files.find((f) => f.path.toLowerCase().endsWith(".html"));
    }

    if (!htmlFile) {
      return new Response("No HTML file found in this project.", { status: 404 });
    }

    let renderedHtml = htmlFile.content;

    // Inline styles.css if present to make preview self-contained
    const cssFile = project.files.find((f) => f.path.toLowerCase() === "styles.css");
    if (cssFile) {
      const styleTag = `<style>\n/* Inlined styles.css */\n${cssFile.content}\n</style>`;
      if (renderedHtml.includes("</head>")) {
        renderedHtml = renderedHtml.replace("</head>", `${styleTag}\n</head>`);
      } else {
        renderedHtml = `${styleTag}\n${renderedHtml}`;
      }
    }

    // Inline script.js if present
    const jsFile = project.files.find((f) => f.path.toLowerCase() === "script.js");
    if (jsFile) {
      const scriptTag = `<script>\n// Inlined script.js\ndocument.addEventListener("DOMContentLoaded", function() {\n${jsFile.content}\n});\n</script>`;
      if (renderedHtml.includes("</body>")) {
        renderedHtml = renderedHtml.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        renderedHtml = `${renderedHtml}\n${scriptTag}`;
      }
    }

    return new Response(renderedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error("Preview render error:", error);
    return new Response("Failed to render preview", { status: 500 });
  }
}
