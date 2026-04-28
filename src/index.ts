import { serve } from "bun";
import index from "./index.html";

const serveFile = (path: string) => {
  try {
    return new Response(Bun.file(path));
  } catch {
    return new Response("Not found", { status: 404 });
  }
};

const server = serve({
  routes: {
    "/classroom.html": serveFile("./public/classroom.html"),
    "/logo.svg": serveFile("./public/logo.svg"),

    "/games/*": async (req) => {
      const path = new URL(req.url).pathname;
      return serveFile(`./public${path}`);
    },

    "/*": index,

    "/api/hello": {
      async GET(req) {
        return Response.json({ message: "Hello, world!", method: "GET" });
      },
      async PUT(req) {
        return Response.json({ message: "Hello, world!", method: "PUT" });
      },
    },

    "/api/hello/:name": async (req) => {
      const name = req.params.name;
      return Response.json({ message: `Hello, ${name}!` });
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}`);