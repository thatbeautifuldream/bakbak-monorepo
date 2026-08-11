export const EXTENSION_VERSION = "0.0.1"

export const EXTENSION_DOWNLOAD_URL = `https://github.com/thatbeautifuldream/bakbak-monorepo/releases/download/v${EXTENSION_VERSION}/extension-${EXTENSION_VERSION}-chrome.zip`

/** Chrome only installs an unpacked folder, so the zip has to be expanded first. */
export const INSTALL_STEPS = [
  "Download the zip and unzip it",
  "Open chrome://extensions and turn on Developer mode",
  "Drag the unzipped folder onto that page",
]
