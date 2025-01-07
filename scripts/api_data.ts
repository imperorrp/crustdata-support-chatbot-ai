// Define your custom chunks here
export const customChunks = [
    {
      content: "GET /users: Retrieves a list of all users. Includes pagination.",
      metadata: { endpoint: "/users", method: "GET" },
    },
    {
      content:
        "POST /users: Creates a new user. Requires `name`, `email`, and `password` fields.",
      metadata: { endpoint: "/users", method: "POST" },
    },
    {
      content:
        "DELETE /users/:id: Deletes the user with the given ID. Requires admin privileges.",
      metadata: { endpoint: "/users/:id", method: "DELETE" },
    },
  ];