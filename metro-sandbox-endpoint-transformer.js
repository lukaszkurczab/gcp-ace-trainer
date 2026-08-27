const traverse = require("@babel/traverse").default;
const { createTransformer, getExpoTransformer } = require("react-native-svg-transformer");

const SANDBOX_AUTH_ORIGIN = "https://patternly-app-sandbox.firebaseapp.com";
const upstreamTransformer = getExpoTransformer();

if (!upstreamTransformer) throw new Error("Expo Metro transformer is unavailable.");

function sanitizeSandboxValue(value) {
  return value
    .replaceAll("http://localhost", SANDBOX_AUTH_ORIGIN)
    .replaceAll("https://localhost", SANDBOX_AUTH_ORIGIN)
    .replaceAll("localhost", "sandbox.invalid")
    .replaceAll("127.0.0.1", "sandbox.invalid")
    .replaceAll("10.0.2.2", "sandbox.invalid")
    .replaceAll("expo-development-client", "patternly-sandbox");
}

function sanitizeSandboxAst(ast) {
  traverse(ast, {
    enter(path) {
      const node = path.node;
      delete node.leadingComments;
      delete node.trailingComments;
      delete node.innerComments;
      if (node.type === "StringLiteral" || node.type === "DirectiveLiteral") {
        const nextValue = sanitizeSandboxValue(node.value);
        if (nextValue !== node.value) {
          node.value = nextValue;
          node.extra = undefined;
        }
      }
      if (node.type === "TemplateElement") {
        const nextValue = sanitizeSandboxValue(node.value.raw);
        if (nextValue !== node.value.raw) {
          node.value.raw = nextValue;
          node.value.cooked = nextValue;
        }
      }
      if (node.type === "RegExpLiteral") {
        const nextPattern = sanitizeSandboxValue(node.pattern);
        if (nextPattern !== node.pattern) node.pattern = nextPattern;
      }
    },
  });
  return ast;
}

const expoSvgTransformer = createTransformer(upstreamTransformer);

module.exports.transform = async ({ src, ...rest }) => {
  const result = await expoSvgTransformer({ src, ...rest });
  if (process.env.PATTERNLY_ANDROID_SANDBOX !== "1" || !result.ast) return result;
  sanitizeSandboxAst(result.ast);
  return result;
};

module.exports.getCacheKey = () => `patternly-sandbox-endpoint-boundary:${process.env.PATTERNLY_ANDROID_SANDBOX === "1" ? "sandbox" : "default"}`;
module.exports.sanitizeSandboxAst = sanitizeSandboxAst;
module.exports.sanitizeSandboxValue = sanitizeSandboxValue;
