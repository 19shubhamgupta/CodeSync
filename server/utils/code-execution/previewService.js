import { createProxyMiddleware } from "http-proxy-middleware";
import { getRunInfo } from "./dockerRunService.js";

function setupProxyRoutes(app) {
  app.use("/preview/:workspaceId", (req, res, next) => {
    const { workspaceId } = req.params;
    const info = getRunInfo(workspaceId);

    if (!info) {
      return res.status(404).json({ error: "No running container for this workspace" });
    }

    // strip the /preview/:id prefix before forwarding
    req.url = req.url.replace(`/preview/${workspaceId}`, "") || "/";

    createProxyMiddleware({
      target: `http://localhost:${info.port}`,
      changeOrigin: true,
      ws: true, // needed for Vite HMR
    })(req, res, next);
  });
}

export { setupProxyRoutes };