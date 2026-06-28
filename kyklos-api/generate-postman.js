const fs = require('fs');
const Converter = require('openapi-to-postmanv2');

fetch('http://localhost:4000/api/docs-json')
  .then(res => res.json())
  .then(openapiData => {
    Converter.convert({ type: 'json', data: openapiData },
      { requestParametersResolution: 'Example' }, (err, conversionResult) => {
        if (!conversionResult.result) {
          console.error('Could not convert', conversionResult.reason);
        } else {
          const postmanData = conversionResult.output[0].data;
          
          // Inject variable
          postmanData.variable = [
            { key: "baseUrl", value: "http://localhost:4000", type: "string" },
            { key: "authToken", value: "", type: "string" }
          ];

          fs.writeFileSync('Kyklos_API_Postman_Collection.json', JSON.stringify(postmanData, null, 2));
          console.log('Postman collection generated successfully: Kyklos_API_Postman_Collection.json');
        }
      }
    );
  })
  .catch(err => console.error('Fetch error:', err));
