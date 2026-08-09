export const EXTENSION_VERSION = "0.0.1"

export const EXTENSION_DOWNLOAD_URL = `https://github.com/thatbeautifuldream/bakbak-monorepo/releases/download/v${EXTENSION_VERSION}/extension-${EXTENSION_VERSION}-chrome.zip`

export const INSTALL_STEPS = [
  {
    label: "Download and unzip",
    detail:
      "Chrome installs an unpacked folder, so expand the archive after it downloads.",
  },
  {
    label: "Open chrome://extensions",
    detail: "Turn on Developer mode using the toggle in the top right corner.",
  },
  {
    label: "Drop the folder in",
    detail:
      "Drag the unzipped folder onto that page, then sign in here to start talking.",
  },
]
