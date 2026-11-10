# MindAR target build

`targets.mind` is the local fallback bundle used for AR tracking. It contains
these source marker images, in exactly this order:

1. `crisanto-marker.jpg`
2. `mcarthurmarker.jpg`

Save the MindAR compiler output in this folder with the exact filename
`targets.mind`. The order matters: target indexes must match the built-in
artwork order in `app.js`.

`asset-manifest.js` includes this file so it is downloaded for offline use.
