import "socket.io";

declare module "socket.io" {
  interface Socket {
    user: {
      userId: string;
      /** Display handle (from `username`, else name / email local-part). */
      username: string;
      email: string;
      name?: string;
    };
  }
}
