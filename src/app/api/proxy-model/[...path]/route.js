export async function GET(request, { params }) {
  try {
    // Attendre params pour Next.js 15
    const resolvedParams = await params;
    const { path } = resolvedParams;
    const fullPath = Array.isArray(path) ? path.join("/") : path;

    // Construire l'URL Firebase Storage directement
    const firebaseUrl = `https://firebasestorage.googleapis.com/${fullPath}`;

    console.log("🔄 Proxy vers:", firebaseUrl);

    // Faire la requête vers Firebase Storage
    const response = await fetch(firebaseUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AstroLearn/1.0)",
      },
    });

    if (!response.ok) {
      console.error(
        "❌ Erreur Firebase Storage:",
        response.status,
        response.statusText
      );
      return new Response("Modèle non trouvé", { status: 404 });
    }

    // Récupérer le contenu
    const buffer = await response.arrayBuffer();

    // Retourner avec les bons headers CORS
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "model/gltf-binary",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=31536000", // Cache 1 an
      },
    });
  } catch (error) {
    console.error("❌ Erreur proxy modèle 3D:", error);
    return new Response("Erreur serveur", { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
