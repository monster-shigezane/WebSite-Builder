// Google Workspace API Client
// Implements real REST integration for Drive, Docs, and Gmail using OAuth token

export interface DriveFolderResponse {
  id: string;
  name: string;
}

export interface DriveFileResponse {
  id: string;
  name: string;
}

/**
 * Creates a folder in the user's Google Drive.
 */
export async function createDriveFolder(
  folderName: string,
  accessToken: string
): Promise<DriveFolderResponse> {
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create Drive folder.");
  }

  return response.json();
}

/**
 * Creates a file metadata placeholder in Google Drive inside a folder,
 * and then uploads the media content.
 */
export async function uploadFileToDrive(
  folderId: string,
  fileName: string,
  content: string,
  mimeType: string,
  accessToken: string
): Promise<DriveFileResponse> {
  // Step 1: Create the file metadata in Drive
  const metadataResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: fileName,
      parents: [folderId],
      mimeType: mimeType,
    }),
  });

  if (!metadataResponse.ok) {
    const err = await metadataResponse.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create metadata for ${fileName}`);
  }

  const fileMeta = await metadataResponse.json();
  const fileId = fileMeta.id;

  // Step 2: Upload the actual raw data using media update PATCH
  const mediaResponse = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: content,
    }
  );

  if (!mediaResponse.ok) {
    const err = await mediaResponse.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to upload content for ${fileName}`);
  }

  return mediaResponse.json();
}

/**
 * Creates a beautiful Google Doc with sitemap documentation and copies.
 */
export async function createGoogleDoc(
  docTitle: string,
  introduction: string,
  sections: { title: string; content: string }[],
  accessToken: string
): Promise<{ documentId: string; url: string }> {
  // Step 1: Create an empty document
  const createResponse = await fetch("https://docs.googleapis.com/v1/documents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createResponse.ok) {
    const err = await createResponse.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to create Google Doc");
  }

  const doc = await createResponse.json();
  const documentId = doc.documentId;

  // Step 2: Assemble batch requests to insert the structured content in reverse order
  // inserts must go in reverse order or use index tracking.
  // The simplest is to join all text into a single big string or push sequentially!
  // To avoid complexity of index shift, we can assemble a single formatted Markdown/Text doc content and insert it.
  
  let bodyText = `${docTitle}\n=========================================\n\n`;
  bodyText += `${introduction}\n\n`;
  
  sections.forEach((sec) => {
    bodyText += `## ${sec.title}\n-----------------------------------------\n`;
    bodyText += `${sec.content}\n\n`;
  });

  const batchResponse = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              text: bodyText,
              location: {
                index: 1,
              },
            },
          },
        ],
      }),
    }
  );

  if (!batchResponse.ok) {
    const err = await batchResponse.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to update Google Doc content.");
  }

  return {
    documentId,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/**
 * Sends a high-polish, full structured campaign email via the logged-in Gmail.
 */
export async function sendGmailCampaign(
  recipientEmail: string,
  subject: string,
  htmlContent: string,
  accessToken: string
): Promise<{ id: string }> {
  // Gmail format requires RFC 2822 format with base64Url formatting
  const emailLines = [
    `To: ${recipientEmail}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    htmlContent,
  ];

  const emailRaw = emailLines.join("\r\n");
  
  // Safe base64url encoding in client-side JS
  const encodedEmail = btoa(unescape(encodeURIComponent(emailRaw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || "Failed to send Gmail message.");
  }

  return response.json();
}
