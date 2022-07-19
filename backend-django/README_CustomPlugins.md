### Documentation for third-party plugins

`Plugins` are self-contained web-applications, which are used to modify, process and render data for presentational
purposes (e.g. a chemical formula editor, which processes textual-information on chemical compounds to create and
display a graphical representation of these compounds). This representational data is referred to as `rawdata`
throughout this document.
`Plugins` can be added by users to labbooks as `plugin instances`. `Plugin instances` are derived from a certain type of
`plugin`, but each instance uses its own, separate `rawdata`.

Plugin instances are embedded in labbooks through iframes. This provides separation of the native workbench frontend
codebase and the self-contained plugin-codebase. Through authenticated calls to the workbench's REST-API, a `plugin
instance` communicates with the backend to fetch and save required `rawdata`.
In order for this to work seamlessly, some functional requirements have to be met. The aim of this document is to
describe these requirements and provide concrete code-examples.

#### Workflow

A selection of available `plugins` is defined by administrators in the backend. `Plugin` entries consist of:
* a title (String)
* a short description (String)
* a long description (HTML)
* a logo (Image-File)
* a placeholder image (Image-File)
* a path where the plugin resides (Path)
* responsible users (User IDs)
* permissions, privileges and availability

The codebase of a `plugin resides` on the workbench-NAS and can be accessed through the `path`-attribute, which, along
with other metadata, is returned by the API when a request to a `plugin instance` has been sent.

Workbench-Users can add a `plugin instance` to a labbook through a selection dialog. After a specific plugin has been
selected and it's placement in the labbook defined, a new `plugin instance` is created in the backend, with a reference
to the selected `plugin`.

A `plugin instance` consists of:
* a title (String)
* reference to a plugin (Foreign Key)
* rawdata (File)
* picture representation (Image-File)
* reference to projects (Foreign Keys)

After the `plugin instance` has been created, its picture representation is requested by the frontend in order to
display it within the labbook. As no `rawdata` for this `plugin instance` is available in the beginning, the
`placeholder image` provided by the plugin is displayed instead.

After editing the `plugin instance`, the resulting `rawdata` is sent to the backend. If the `plugin` is capable of
rendering a graphical representation of the `plugin-instance's` `rawdata`, the resulting representational picture can
also be saved to the backend and will be used instead of the `placeholder image` in "view"-mode. By clicking on the
representational picture, the plugin is loaded and the data can be edited.

The next chapters in this document describe in detail how fetching and saving the `rawdata` and the `picture
representation` from and to the workbench REST-API has to be implemented in a `plugin`.

#### Declaration of backend URL, primary key and authentication token

To load and save plugin-specific data from and to the REST-API, HTTP-requests are sent to it through an URL.
This URL has to be defined in the `plugin's` codebase and consists of the following components:
* Base URL (Points to the Workbench REST API)
* Primary key of the plugin instance (Created by the backend when a new `plugin instance`-element is added to a Labbook)
* Authentication token based on JWT (Contains authentication information of the current user)

Each part of the URL can be read from the browsers [location-interface](https://developer.mozilla.org/en-US/docs/Web/API/Location):
```javascript
// get params from location
var params = location.href.split('?')[1].split('&');
var locationData = {};
for (x in params) {
    const paramParts = params[x].split('=');
    const key = paramParts[0];
    const value = paramParts[1];
    locationData[key] = value;
}
const apiBaseUrl = decodeURIComponent(locationData.apiBaseUrl);
const pk = locationData.pk;
const jwt  = locationData.jwt;
```

#### Loading data

Data required by the plugin is provided through the REST API. Two API-calls are necessary to fetch it:
First, a GET-call to ```Base URL + Primary Key + Auth Token``` is sent. This fetches the metadata of the plugin. The
result contains an url to download the `rawdata`. This url is designated by the key ```download_rawdata```. It points to
a file containing the actual `rawdata`, which is fetched by a second GET-call.

Here is an example function for the loading-functionality, which goes through the two described requests and then
renders the fetched data with ```myPlugin.renderData()```:

```javascript
// LOAD APP DETAILS FROM BACKEND (Called by onload)

function loadPluginInstanceDetailsfromBackend() {
    url = apiBaseUrl + locationData.pk + '/?jwt=' + locationData.jwt;
    fetch(url)
        .then(function(response) {
            return response.json();
        })
        .then(function(pluginDetailJSON) {
            loadRawdatafromBackend(pluginDetailJSON['download_rawdata']);
        });
}

// LOAD APP DETAILS FROM BACKEND
// the mime-type of the data in this example is 'application/xml' and the rawdata is
// rendered by the function "myPlugin.renderData()"
// function-names and mime-type have to be changed accordingly

function loadRawdatafromBackend(rawDataURL) {
    fetch(rawDataURL)
        .then(function(response) {
            return response.text();
        })
        .then(function(rawdata) {
            if (rawdata) {
                myPlugin.renderData(
                    new DOMParser().parseFromString(
                        rawdata, 'application/xml'
                    )
                );
            }
        });
}
```
    
It is recommended to run this function through the onload-functionality, as soon as the plugins has fully loaded
in the browser, e.g.:

```html
    <body onload="loadPluginInstanceDetailsfromBackend()">
```

#### Saving data

The backend is prepared to store the `plugin instances` `rawdata` and a `picture representation` of the data.
This picture is displayed in the labbook when the `plugin instance` is in "view"-mode. If capable, the plugin has to
generate this `picture representation` of the data and then send both the `rawdata` and the image to the backend
as `multipart/form-data`. If no image representation of the `rawdata` can be generated by the `plugin instance`, the
`plugin's` `placeholder image` will be shown in the labbook instead.

To add the rendered image to the form, a [Blob object](https://developer.mozilla.org/en-US/docs/Web/API/Blob) containing
the image-data and mime-type should be created. An example is given in the function ```dataURItoBlob()``` in the example
below. This step can be left out if the image is provided as a
[File object](https://developer.mozilla.org/en-US/docs/Web/API/File) (E.g. when uploaded through a form in the app).

Here is a final full code-example, that describes the entire required save-functionality (Started by a click-event):

```javascript
save.addEventListener( 'click', function () {

  // create a file from the plugin instance's rawdata
  myPluginInstanceRawdata = editor.toString();
  var file = new Blob([myPluginInstanceRawdata], { type: 'text/xml'});
  var img = myPluginInstance.createImageFromData();
  var formData = new FormData();

  function dataURItoBlob(dataURI) {
      // convert base64/URLEncoded data component to raw binary data held in a string
      var byteString;
      if (dataURI.split(',')[0].indexOf('base64') >= 0)
          byteString = atob(dataURI.split(',')[1]);
      else
          byteString = unescape(dataURI.split(',')[1]);

      // separate the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes from the string-representation to a typed array
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
      }

      return new Blob([ia], {type:mimeString});
  }

  function appendImgToFormAndSend() {
      // create image and append to form
      var image = dataURItoBlob(img[0].src);
      formData.append('image', image, 'myplugin_image_representation.png');
      
      // append rawdata of the app
      formData.append('rawdata', file, 'myplugin_rawdata.data');

      // set authentication header with given token
      const headers = new Headers({
          'Authorization': 'JWT ' + locationData.jwt
      });

      const options = {
          method: 'PATCH',
          body: formData,
          credentials: "include", // add all credentials (cookies & authentication headers) to request
          headers
      };

      url = apiBaseUrl + locationData.pk + '/';
      fetch(url, options)
          .then(response => response.json())
          .catch(error => console.error('Error:', error))
          .then(response => console.log('Success:', JSON.stringify(response)));
  }
});
```

#### Installing a third-party app in the Workbench

For security reasons, the third-party app must be served through the same domain and port as the
workbench-application, as defined by the
[same-origin policy](http://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy). Therefore, publishing
a plugin is limited to the workbench. An administrator can upload the plugin's codebase to the workbench and
define its location through the path-attribute in the administration panel, which will be returned to the frontend on a
request.
