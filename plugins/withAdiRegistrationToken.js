const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

function getSnippet(config, pluginProps) {
  const fromProps = pluginProps && typeof pluginProps.snippet === "string" ? pluginProps.snippet : null;
  if (fromProps && fromProps.trim()) return fromProps.trim();

  const fromExtra = config.extra && typeof config.extra.adiRegistrationSnippet === "string"
    ? config.extra.adiRegistrationSnippet
    : null;
  if (fromExtra && fromExtra.trim()) return fromExtra.trim();

  // Back-compat: if someone stored it under android.extra in app.json
  const fromAndroidExtra =
    config.android &&
    config.android.extra &&
    typeof config.android.extra["adi-registration.properties"] === "string"
      ? config.android.extra["adi-registration.properties"]
      : null;
  if (fromAndroidExtra && fromAndroidExtra.trim()) return fromAndroidExtra.trim();

  return null;
}

module.exports = function withAdiRegistrationToken(config, pluginProps = {}) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const snippet = getSnippet(config, pluginProps);
      if (!snippet) {
        throw new Error(
          "Missing ADI registration snippet. Set `expo.extra.adiRegistrationSnippet` in app.json/app.config, or pass { snippet } to the plugin."
        );
      }

      const androidProjectRoot = config.modRequest.platformProjectRoot;
      const assetsDir = path.join(androidProjectRoot, "app", "src", "main", "assets");
      const tokenFile = path.join(assetsDir, "adi-registration.properties");

      await fs.promises.mkdir(assetsDir, { recursive: true });
      await fs.promises.writeFile(tokenFile, `${snippet}\n`, "utf8");

      return config;
    },
  ]);
};

