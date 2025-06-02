import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { initFirebaseAdmin } from "@/lib/firebase/admin";

export async function GET(request, { params }) {
  try {
    // Attendre params pour Next.js 15
    const resolvedParams = await params;
    const { path } = resolvedParams;
    const fullPath = Array.isArray(path) ? path.join("/") : path;

    console.log("🔄 Proxy Storage vers:", fullPath);

    // Initialiser Firebase Admin
    const app = initFirebaseAdmin();
    const auth = getAuth(app);
    const storage = getStorage(app);

    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Non autorisé", { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;

    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (authError) {
      console.error("❌ Erreur auth:", authError);
      return new Response("Token invalide", { status: 401 });
    }

    // Vérifier que l'utilisateur accède à ses propres données
    if (fullPath.includes("users/")) {
      const pathParts = fullPath.split("/");
      const userIdInPath = pathParts[1];

      if (userIdInPath !== decodedToken.uid) {
        console.error("❌ Accès interdit:", {
          requested: userIdInPath,
          actual: decodedToken.uid,
        });
        return new Response("Accès interdit", { status: 403 });
      }
    }

    // Récupérer le fichier depuis Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(fullPath);

    try {
      const [exists] = await file.exists();
      if (!exists) {
        return new Response("Fichier non trouvé", { status: 404 });
      }

      const [buffer] = await file.download();

      // Déterminer le type de contenu
      let contentType = "application/octet-stream";
      if (fullPath.endsWith(".json")) {
        contentType = "application/json";
      } else if (fullPath.endsWith(".gltf")) {
        contentType = "model/gltf+json";
      } else if (fullPath.endsWith(".glb")) {
        contentType = "model/gltf-binary";
      }

      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Cache-Control": "private, max-age=300", // Cache 5 minutes
        },
      });
    } catch (storageError) {
      console.error("❌ Erreur Storage:", storageError);
      return new Response("Erreur de stockage", { status: 500 });
    }
  } catch (error) {
    console.error("❌ Erreur proxy storage:", error);
    return new Response("Erreur serveur", { status: 500 });
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
