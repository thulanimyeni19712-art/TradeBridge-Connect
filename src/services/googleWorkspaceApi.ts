/**
 * Client-Side Google Workspace REST API Service
 * Supports Google Calendar, Google Meet, Google Contacts (People API),
 * Google Docs, Google Slides, Google Forms, and Drive-backed Desk Notes.
 */

export interface CalendarEventItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

export interface MeetSpaceItem {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
  };
}

export interface WorkspaceContactItem {
  resourceName: string;
  etag?: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  organization?: string;
}

export interface WorkspaceDriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface GoogleDocSummary {
  documentId: string;
  title: string;
  revisionId?: string;
  plainText: string;
}

export interface GoogleSlideSummary {
  presentationId: string;
  title: string;
  slideCount: number;
  slides: Array<{
    objectId: string;
    previewText: string;
  }>;
}

export interface GoogleFormSummary {
  formId: string;
  title: string;
  description?: string;
  responderUri?: string;
  questions: Array<{
    itemId: string;
    title: string;
    kind: string;
  }>;
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime?: string;
  respondentEmail?: string;
  answersSummary: string[];
}

async function parseGoogleResponse<T>(res: Response, serviceName: string): Promise<T> {
  if (!res.ok) {
    let detail = `${serviceName} HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody?.error?.message) {
        detail = `${serviceName}: ${errBody.error.message}`;
      }
    } catch {
      // Ignore parse failure
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return {} as T;
  }
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// 1. GOOGLE CALENDAR (calendar/v3)
// ---------------------------------------------------------------------------

export async function listCalendarEvents(
  accessToken: string,
  maxResults = 12
): Promise<CalendarEventItem[]> {
  const timeMin = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=${maxResults}&timeMin=${encodeURIComponent(
    timeMin
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{ items?: CalendarEventItem[] }>(res, 'Google Calendar');
  return data.items || [];
}

export async function createCalendarEvent(
  accessToken: string,
  payload: {
    summary: string;
    description?: string;
    location?: string;
    startIso: string;
    endIso: string;
  }
): Promise<CalendarEventItem> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: payload.summary,
        description: payload.description || '',
        location: payload.location || '',
        start: { dateTime: payload.startIso },
        end: { dateTime: payload.endIso },
      }),
    }
  );
  return parseGoogleResponse<CalendarEventItem>(res, 'Google Calendar');
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  payload: {
    summary: string;
    description?: string;
    startIso?: string;
    endIso?: string;
  }
): Promise<CalendarEventItem> {
  const safeId = encodeURIComponent(eventId.trim());
  const body: Record<string, unknown> = {
    summary: payload.summary,
    description: payload.description,
  };
  if (payload.startIso && payload.endIso) {
    body.start = { dateTime: payload.startIso };
    body.end = { dateTime: payload.endIso };
  }
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${safeId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  return parseGoogleResponse<CalendarEventItem>(res, 'Google Calendar');
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const safeId = encodeURIComponent(eventId.trim());
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${safeId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  await parseGoogleResponse<Record<string, never>>(res, 'Google Calendar');
}

// ---------------------------------------------------------------------------
// 2. GOOGLE MEET (meet.googleapis.com/v2)
// ---------------------------------------------------------------------------

export async function createMeetSpace(
  accessToken: string,
  accessType: 'OPEN' | 'TRUSTED' | 'RESTRICTED' = 'TRUSTED'
): Promise<MeetSpaceItem> {
  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      config: { accessType },
    }),
  });
  return parseGoogleResponse<MeetSpaceItem>(res, 'Google Meet');
}

export async function updateMeetSpaceAccess(
  accessToken: string,
  spaceName: string,
  accessType: 'OPEN' | 'TRUSTED' | 'RESTRICTED'
): Promise<MeetSpaceItem> {
  const safeName = spaceName
    .split('/')
    .map((seg) => encodeURIComponent(seg.trim()))
    .join('/');
  const res = await fetch(
    `https://meet.googleapis.com/v2/${safeName}?updateMask=config.accessType`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: { accessType },
      }),
    }
  );
  return parseGoogleResponse<MeetSpaceItem>(res, 'Google Meet');
}

// ---------------------------------------------------------------------------
// 3. GOOGLE CONTACTS / PEOPLE API (people.googleapis.com/v1)
// ---------------------------------------------------------------------------

export async function getMeProfile(
  accessToken: string
): Promise<{ displayName: string; email?: string }> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await parseGoogleResponse<{
    names?: Array<{ displayName?: string }>;
    emailAddresses?: Array<{ value?: string }>;
  }>(res, 'People API');
  return {
    displayName: data.names?.[0]?.displayName || 'Workspace User',
    email: data.emailAddresses?.[0]?.value,
  };
}

export async function listContacts(
  accessToken: string
): Promise<WorkspaceContactItem[]> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people/me/connections?pageSize=25&personFields=names,emailAddresses,phoneNumbers,organizations',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const data = await parseGoogleResponse<{
    connections?: Array<{
      resourceName: string;
      etag?: string;
      names?: Array<{ displayName?: string }>;
      emailAddresses?: Array<{ value?: string }>;
      phoneNumbers?: Array<{ value?: string }>;
      organizations?: Array<{ name?: string }>;
    }>;
  }>(res, 'Google Contacts');

  return (data.connections || []).map((c) => ({
    resourceName: c.resourceName,
    etag: c.etag,
    displayName: c.names?.[0]?.displayName || c.emailAddresses?.[0]?.value || 'Unnamed Contact',
    email: c.emailAddresses?.[0]?.value,
    phoneNumber: c.phoneNumbers?.[0]?.value,
    organization: c.organizations?.[0]?.name,
  }));
}

export async function createContact(
  accessToken: string,
  payload: {
    givenName: string;
    familyName?: string;
    email?: string;
    phoneNumber?: string;
    organization?: string;
  }
): Promise<WorkspaceContactItem> {
  const res = await fetch(
    'https://people.googleapis.com/v1/people:createContact',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        names: [{ givenName: payload.givenName, familyName: payload.familyName || '' }],
        emailAddresses: payload.email ? [{ value: payload.email }] : [],
        phoneNumbers: payload.phoneNumber ? [{ value: payload.phoneNumber }] : [],
        organizations: payload.organization ? [{ name: payload.organization }] : [],
      }),
    }
  );
  const c = await parseGoogleResponse<{
    resourceName: string;
    etag?: string;
    names?: Array<{ displayName?: string }>;
    emailAddresses?: Array<{ value?: string }>;
    phoneNumbers?: Array<{ value?: string }>;
    organizations?: Array<{ name?: string }>;
  }>(res, 'Google Contacts');

  return {
    resourceName: c.resourceName,
    etag: c.etag,
    displayName: c.names?.[0]?.displayName || payload.givenName,
    email: c.emailAddresses?.[0]?.value || payload.email,
    phoneNumber: c.phoneNumbers?.[0]?.value || payload.phoneNumber,
    organization: c.organizations?.[0]?.name || payload.organization,
  };
}

export async function deleteContact(
  accessToken: string,
  resourceName: string
): Promise<void> {
  const safePath = resourceName
    .split('/')
    .map((seg) => encodeURIComponent(seg.trim()))
    .join('/');
  const res = await fetch(
    `https://people.googleapis.com/v1/${safePath}:deleteContact`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  await parseGoogleResponse<Record<string, never>>(res, 'Google Contacts');
}

// ---------------------------------------------------------------------------
// 4. GOOGLE DOCS (docs.googleapis.com/v1)
// ---------------------------------------------------------------------------

export async function listDriveFilesByMime(
  accessToken: string,
  mimeType: string,
  namePrefix?: string
): Promise<WorkspaceDriveFileSummary[]> {
  let q = `mimeType='${mimeType}' and trashed=false`;
  if (namePrefix) {
    const escaped = namePrefix.replace(/'/g, "\\'");
    q += ` and name contains '${escaped}'`;
  }
  const url = `https://www.googleapis.com/drive/v3/files?pageSize=15&orderBy=modifiedTime%20desc&fields=files(id,name,mimeType,modifiedTime,webViewLink)&q=${encodeURIComponent(
    q
  )}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{ files?: WorkspaceDriveFileSummary[] }>(res, 'Google Drive');
  return data.files || [];
}

export async function createGoogleDoc(
  accessToken: string,
  title: string,
  initialBody?: string
): Promise<GoogleDocSummary> {
  const res = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const created = await parseGoogleResponse<{ documentId: string; title: string; revisionId?: string }>(
    res,
    'Google Docs'
  );

  if (initialBody && initialBody.trim()) {
    await appendGoogleDocText(accessToken, created.documentId, initialBody.trim());
  }

  return getGoogleDoc(accessToken, created.documentId);
}

export async function getGoogleDoc(
  accessToken: string,
  documentId: string
): Promise<GoogleDocSummary> {
  const safeId = encodeURIComponent(documentId.trim());
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${safeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const docData = await parseGoogleResponse<{
    documentId: string;
    title: string;
    revisionId?: string;
    body?: {
      content?: Array<{
        paragraph?: {
          elements?: Array<{ textRun?: { content?: string } }>;
        };
      }>;
    };
  }>(res, 'Google Docs');

  const lines: string[] = [];
  for (const el of docData.body?.content || []) {
    if (el.paragraph?.elements) {
      const text = el.paragraph.elements.map((e) => e.textRun?.content || '').join('');
      if (text) lines.push(text);
    }
  }

  return {
    documentId: docData.documentId,
    title: docData.title,
    revisionId: docData.revisionId,
    plainText: lines.join(''),
  };
}

export async function appendGoogleDocText(
  accessToken: string,
  documentId: string,
  textToAppend: string
): Promise<void> {
  const safeId = encodeURIComponent(documentId.trim());
  const docRes = await fetch(`https://docs.googleapis.com/v1/documents/${safeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const raw = await parseGoogleResponse<{
    body?: { content?: Array<{ endIndex?: number }> };
  }>(docRes, 'Google Docs');

  const content = raw.body?.content || [];
  const lastEnd = content.length > 0 ? content[content.length - 1]?.endIndex || 1 : 1;
  const insertAt = Math.max(1, lastEnd - 1);

  const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${safeId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: insertAt },
            text: `\n${textToAppend}\n`,
          },
        },
      ],
    }),
  });
  await parseGoogleResponse<Record<string, unknown>>(updateRes, 'Google Docs');
}

// ---------------------------------------------------------------------------
// 5. GOOGLE SLIDES (slides.googleapis.com/v1)
// ---------------------------------------------------------------------------

export async function createGoogleSlideDeck(
  accessToken: string,
  title: string
): Promise<GoogleSlideSummary> {
  const res = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  const created = await parseGoogleResponse<{ presentationId: string }>(res, 'Google Slides');
  return getGoogleSlideDeck(accessToken, created.presentationId);
}

export async function getGoogleSlideDeck(
  accessToken: string,
  presentationId: string
): Promise<GoogleSlideSummary> {
  const safeId = encodeURIComponent(presentationId.trim());
  const res = await fetch(`https://slides.googleapis.com/v1/presentations/${safeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const deck = await parseGoogleResponse<{
    presentationId: string;
    title: string;
    slides?: Array<{
      objectId: string;
      pageElements?: Array<{
        shape?: {
          text?: {
            textElements?: Array<{ textRun?: { content?: string } }>;
          };
        };
      }>;
    }>;
  }>(res, 'Google Slides');

  const slides = (deck.slides || []).map((s, idx) => {
    const fragments: string[] = [];
    for (const el of s.pageElements || []) {
      for (const te of el.shape?.text?.textElements || []) {
        if (te.textRun?.content?.trim()) {
          fragments.push(te.textRun.content.trim());
        }
      }
    }
    return {
      objectId: s.objectId,
      previewText: fragments.join(' • ') || `Slide ${idx + 1} (Blank / Layout)`,
    };
  });

  return {
    presentationId: deck.presentationId,
    title: deck.title,
    slideCount: slides.length,
    slides,
  };
}

export async function addSlideToDeck(
  accessToken: string,
  presentationId: string,
  headingText: string
): Promise<GoogleSlideSummary> {
  const safeId = encodeURIComponent(presentationId.trim());
  const slideId = `slide_${Date.now()}`;
  const titleBoxId = `title_${Date.now()}`;

  const res = await fetch(
    `https://slides.googleapis.com/v1/presentations/${safeId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            createSlide: {
              objectId: slideId,
              slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
              placeholderIdMappings: [
                {
                  layoutPlaceholder: { type: 'TITLE', index: 0 },
                  objectId: titleBoxId,
                },
              ],
            },
          },
          {
            insertText: {
              objectId: titleBoxId,
              text: headingText,
            },
          },
        ],
      }),
    }
  );
  await parseGoogleResponse<Record<string, unknown>>(res, 'Google Slides');
  return getGoogleSlideDeck(accessToken, presentationId);
}

// ---------------------------------------------------------------------------
// 6. GOOGLE FORMS (forms.googleapis.com/v1)
// ---------------------------------------------------------------------------

export async function createGoogleForm(
  accessToken: string,
  title: string
): Promise<GoogleFormSummary> {
  const res = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: { title, documentTitle: title },
    }),
  });
  const created = await parseGoogleResponse<{ formId: string }>(res, 'Google Forms');
  return getGoogleForm(accessToken, created.formId);
}

export async function getGoogleForm(
  accessToken: string,
  formId: string
): Promise<GoogleFormSummary> {
  const safeId = encodeURIComponent(formId.trim());
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${safeId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const raw = await parseGoogleResponse<{
    formId: string;
    responderUri?: string;
    info?: { title?: string; description?: string };
    items?: Array<{
      itemId: string;
      title?: string;
      questionItem?: unknown;
    }>;
  }>(res, 'Google Forms');

  return {
    formId: raw.formId,
    title: raw.info?.title || 'Untitled Form',
    description: raw.info?.description,
    responderUri: raw.responderUri,
    questions: (raw.items || []).map((it) => ({
      itemId: it.itemId,
      title: it.title || 'Untitled Question',
      kind: it.questionItem ? 'Question' : 'Section',
    })),
  };
}

export async function addFormQuestion(
  accessToken: string,
  formId: string,
  questionTitle: string
): Promise<GoogleFormSummary> {
  const safeId = encodeURIComponent(formId.trim());
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${safeId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          createItem: {
            item: {
              title: questionTitle,
              questionItem: {
                question: {
                  required: false,
                  textQuestion: { paragraph: false },
                },
              },
            },
            location: { index: 0 },
          },
        },
      ],
    }),
  });
  await parseGoogleResponse<Record<string, unknown>>(res, 'Google Forms');
  return getGoogleForm(accessToken, formId);
}

export async function listFormResponses(
  accessToken: string,
  formId: string
): Promise<GoogleFormResponseItem[]> {
  const safeId = encodeURIComponent(formId.trim());
  const res = await fetch(`https://forms.googleapis.com/v1/forms/${safeId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await parseGoogleResponse<{
    responses?: Array<{
      responseId: string;
      createTime?: string;
      respondentEmail?: string;
      answers?: Record<
        string,
        {
          textAnswers?: {
            answers?: Array<{ value?: string }>;
          };
        }
      >;
    }>;
  }>(res, 'Google Forms');

  return (data.responses || []).map((r) => {
    const answersSummary: string[] = [];
    if (r.answers) {
      Object.values(r.answers).forEach((ans) => {
        (ans.textAnswers?.answers || []).forEach((a) => {
          if (a.value) answersSummary.push(a.value);
        });
      });
    }
    return {
      responseId: r.responseId,
      createTime: r.createTime,
      respondentEmail: r.respondentEmail,
      answersSummary,
    };
  });
}

// ---------------------------------------------------------------------------
// 7. DRIVE FILE MANAGEMENT (Used for Desk Notes & File Cleanup)
// ---------------------------------------------------------------------------

export async function deleteDriveFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const safeId = encodeURIComponent(fileId.trim());
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${safeId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  await parseGoogleResponse<Record<string, never>>(res, 'Google Drive');
}
