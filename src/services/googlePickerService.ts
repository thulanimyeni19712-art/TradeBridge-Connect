import { getAccessToken, signInWithGoogleWorkspace } from '../lib/firebase';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface PickedDriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  lastEditedUtc?: string;
  content?: string;
}

/**
 * Ensures the Google API (gapi) client and picker module are loaded into the browser.
 */
export async function loadGooglePickerApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.picker) {
      resolve();
      return;
    }

    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.gapi.load('picker', {
          callback: () => resolve(),
          onerror: () => reject(new Error('Failed to load Google Picker module via gapi.load')),
        });
      };
      script.onerror = () => reject(new Error('Failed to load apis.google.com/js/api.js'));
      document.body.appendChild(script);
    } else {
      window.gapi.load('picker', {
        callback: () => resolve(),
        onerror: () => reject(new Error('Failed to load Google Picker module via gapi.load')),
      });
    }
  });
}

/**
 * Opens Google Picker dialog to select files from Google Drive.
 * Exactly implements the pattern from workspace-integration references/picker.md.
 */
export async function openGooglePicker(options?: {
  title?: string;
  allowedMimeTypes?: string;
  fetchContent?: boolean;
}): Promise<PickedDriveFile | null> {
  // Ensure picker API is loaded
  await loadGooglePickerApi();

  // Get or request OAuth access token
  let token = await getAccessToken();
  if (!token) {
    const authResult = await signInWithGoogleWorkspace();
    token = authResult.accessToken;
  }

  if (!token) {
    throw new Error('Google Workspace OAuth access token is required to open Google Picker.');
  }

  return new Promise((resolve, reject) => {
    try {
      const pickerOrigin =
        window.location.ancestorOrigins && window.location.ancestorOrigins.length > 0
          ? window.location.ancestorOrigins[window.location.ancestorOrigins.length - 1]
          : window.location.origin;

      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      if (options?.allowedMimeTypes) {
        view.setMimeTypes(options.allowedMimeTypes);
      }

      const pickerBuilder = new window.google.picker.PickerBuilder()
        .addView(view)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(token)
        .setOrigin(pickerOrigin)
        .setTitle(options?.title || 'Select Trading Robot, Preset, or Data File')
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            const file: PickedDriveFile = {
              id: doc.id,
              name: doc.name,
              mimeType: doc.mimeType,
              url: doc.url,
              sizeBytes: doc.sizeBytes,
              lastEditedUtc: doc.lastEditedUtc,
            };

            // Optionally fetch text content for .mq5, .mq4, .set, .json, or .txt
            if (options?.fetchContent && file.id) {
              try {
                const response = await fetch(
                  `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (response.ok) {
                  file.content = await response.text();
                }
              } catch (e) {
                console.warn('Could not fetch file contents from Drive:', e);
              }
            }

            resolve(file);
          } else if (data.action === window.google.picker.Action.CANCEL) {
            resolve(null);
          }
        });

      const picker = pickerBuilder.build();
      picker.setVisible(true);
    } catch (err) {
      reject(err);
    }
  });
}
