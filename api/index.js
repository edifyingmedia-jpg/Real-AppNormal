import handler from "../artifacts/api-server/dist/index.mjs";

export default function (req, res) {
  return handler(req, res);
}
