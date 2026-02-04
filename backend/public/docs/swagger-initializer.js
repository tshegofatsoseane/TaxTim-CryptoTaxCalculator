window.onload = function() {
  // Build a system
  const ui = SwaggerUIBundle({
    url: "/docs/api.json", // points to your JSON in public/docs/
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "StandaloneLayout"
  })
  window.ui = ui
}
