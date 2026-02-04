window.onload = function() {
  const ui = SwaggerUIBundle({
    url: "api.json",
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "BaseLayout",
    deepLinking: true
  });
  window.ui = ui;
};
