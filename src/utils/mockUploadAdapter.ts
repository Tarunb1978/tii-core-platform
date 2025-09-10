/**
 * Mock Image Upload Adapter for CKEditor 5
 * 
 * This is a temporary implementation that converts images to base64 for local storage.
 * In production, this should be replaced with a proper backend API that handles:
 * - File upload to cloud storage (AWS S3, Cloudinary, etc.)
 * - Image optimization and resizing
 * - Security validation
 * - CDN distribution
 */

export class MockUploadAdapter {
  private loader: any;
  private xhr: XMLHttpRequest | null = null;

  constructor(loader: any) {
    this.loader = loader;
  }

  // Starts the upload process
  upload(): Promise<{ default: string }> {
    return new Promise((resolve, reject) => {
      this._initRequest();
      this._initListeners(resolve, reject);
      this._sendRequest();
    });
  }

  // Aborts the upload process
  abort(): void {
    if (this.xhr) {
      this.xhr.abort();
    }
  }

  // Initializes the XMLHttpRequest object
  private _initRequest(): void {
    const xhr = (this.xhr = new XMLHttpRequest());
    xhr.open('POST', '/api/upload-image', true);
    xhr.responseType = 'json';
  }

  // Initializes XMLHttpRequest listeners
  private _initListeners(resolve: (value: { default: string }) => void, reject: (reason?: any) => void): void {
    const xhr = this.xhr!;
    const loader = this.loader;
    const genericErrorText = "Couldn't upload file:" + ` ${loader.file.name}.`;

    xhr.addEventListener('error', () => reject(genericErrorText));
    xhr.addEventListener('abort', () => reject());
    xhr.addEventListener('load', () => {
      const response = xhr.response;
      // This example assumes the XHR server's "response" object will come with
      // an "error" property, which is a string with an error message.
      // Your integration may handle upload errors in a different way so make sure
      // it is done properly. The reject() function must be called when the upload fails.
      if (!response || response.error) {
        return reject(response && response.error ? response.error.message : genericErrorText);
      }

      // If the upload is successful, resolve the upload promise with an object containing
      // at least the "default" URL, pointing to the image on the server.
      // This URL will be used to display the image in the content. Learn more in the
      // UploadAdapter#upload documentation.
      resolve({
        default: response.url
      });
    });

    // Upload progress when it is supported. The file loader has the #uploadTotal and #uploaded
    // properties which are used e.g. to display the upload progress bar in the editor
    // user interface.
    if (xhr.upload) {
      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          loader.uploadTotal = evt.total;
          loader.uploaded = evt.loaded;
        }
      });
    }
  }

  // Prepares the data and sends the request
  private _sendRequest(): void {
    // Prepare the form data
    const data = new FormData();
    data.append('upload', this.loader.file);

    // Send the request
    this.xhr!.send(data);
  }
}

/**
 * Mock Image Upload Adapter Factory
 * 
 * This factory creates a mock upload adapter that converts images to base64.
 * In production, replace this with a real upload adapter that uploads to your backend.
 */
export function MockUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    console.log('MockUploadAdapter: Creating upload adapter for loader:', loader);
    
    return {
      upload: () => {
        console.log('MockUploadAdapter: Upload method called');
        
        return new Promise((resolve, reject) => {
          // Check if loader.file is a Promise or a direct File object
          if (loader.file && typeof loader.file.then === 'function') {
            // loader.file is a Promise
            console.log('MockUploadAdapter: loader.file is a Promise, awaiting...');
            loader.file.then((file: File) => {
              console.log('MockUploadAdapter: File received from Promise:', file.name, file.type, file.size);
              processFile(file, resolve, reject);
            }).catch((error: any) => {
              console.error('MockUploadAdapter: Error loading file from Promise:', error);
              reject('Failed to load file: ' + error.message);
            });
          } else if (loader.file instanceof File) {
            // loader.file is already a File object
            console.log('MockUploadAdapter: File received directly:', loader.file.name, loader.file.type, loader.file.size);
            processFile(loader.file, resolve, reject);
          } else {
            console.error('MockUploadAdapter: loader.file is neither Promise nor File:', typeof loader.file, loader.file);
            reject('Invalid file loader - file is neither Promise nor File object');
          }
        });
      },
      abort: () => {
        console.log('MockUploadAdapter: Upload aborted');
        // No-op for base64 conversion
      }
    };
  };
}

/**
 * Helper function to process the file and convert to base64
 */
function processFile(file: File, resolve: (value: { default: string }) => void, reject: (reason?: any) => void) {
  // Validate that we have a proper File object
  if (!file || !(file instanceof File)) {
    reject('Invalid file object received');
    return;
  }
  
  // Check file type
  if (!file.type.startsWith('image/')) {
    reject('File must be an image');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = () => {
    console.log('MockUploadAdapter: File converted to base64 successfully');
    // Convert to base64 data URL
    const base64 = reader.result as string;
    resolve({
      default: base64
    });
  };
  reader.onerror = (error) => {
    console.error('MockUploadAdapter: FileReader error:', error);
    reject('Failed to read file: ' + error);
  };
  reader.readAsDataURL(file);
}
