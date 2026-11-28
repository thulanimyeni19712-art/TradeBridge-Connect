import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useBrand } from '../../context/BrandContext';
import {
  auth,
  getAccessToken,
  signInWithGoogleWorkspace,
  logoutWorkspace,
} from '../../lib/firebase';
import {
  CalendarEventItem,
  MeetSpaceItem,
  WorkspaceContactItem,
  WorkspaceDriveFileSummary,
  GoogleDocSummary,
  GoogleSlideSummary,
  GoogleFormSummary,
  GoogleFormResponseItem,
  listCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  createMeetSpace,
  updateMeetSpaceAccess,
  getMeProfile,
  listContacts,
  createContact,
  deleteContact,
  listDriveFilesByMime,
  createGoogleDoc,
  getGoogleDoc,
  appendGoogleDocText,
  createGoogleSlideDeck,
  getGoogleSlideDeck,
  addSlideToDeck,
  createGoogleForm,
  getGoogleForm,
  addFormQuestion,
  listFormResponses,
  deleteDriveFile,
} from '../../services/googleWorkspaceApi';
import { GoogleDriveIntegrationCard } from '../picker/GoogleDriveIntegrationCard';
import {
  Calendar,
  Video,
  Users,
  FileText,
  Presentation,
  ClipboardList,
  StickyNote,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Lock,
  Info,
  X,
} from 'lucide-react';

type WorkspaceSubTab = 'CALENDAR' | 'MEET_CONTACTS' | 'DOCS_SLIDES' | 'FORMS' | 'KEEP_NOTES';

interface PendingConfirmation {
  title: string;
  description: string;
  targetSummary: string;
  isDestructive?: boolean;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

const DOC_MIME = 'application/vnd.google-apps.document';
const SLIDE_MIME = 'application/vnd.google-apps.presentation';
const FORM_MIME = 'application/vnd.google-apps.form';

export const GoogleWorkspaceHubView: React.FC = () => {
  const { brand } = useBrand();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceSubTab>('CALENDAR');

  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isConfirmExecuting, setIsConfirmExecuting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // 1. CALENDAR STATE
  // ---------------------------------------------------------------------------
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('London Session Desk Sync');
  const [newEventDate, setNewEventDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventDesc, setNewEventDesc] = useState('Daily liquidity review & prop risk limits check.');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventTitle, setEditingEventTitle] = useState('');
  const [editingEventDesc, setEditingEventDesc] = useState('');

  // ---------------------------------------------------------------------------
  // 2. MEET & CONTACTS STATE
  // ---------------------------------------------------------------------------
  const [meetSpaces, setMeetSpaces] = useState<MeetSpaceItem[]>([]);
  const [newMeetAccess, setNewMeetAccess] = useState<'TRUSTED' | 'OPEN' | 'RESTRICTED'>('TRUSTED');
  const [meProfile, setMeProfile] = useState<{ displayName: string; email?: string } | null>(null);
  const [contacts, setContacts] = useState<WorkspaceContactItem[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [contactGivenName, setContactGivenName] = useState('');
  const [contactFamilyName, setContactFamilyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactOrg, setContactOrg] = useState('');

  // ---------------------------------------------------------------------------
  // 3. DOCS & SLIDES STATE
  // ---------------------------------------------------------------------------
  const [docFiles, setDocFiles] = useState<WorkspaceDriveFileSummary[]>([]);
  const [slideFiles, setSlideFiles] = useState<WorkspaceDriveFileSummary[]>([]);
  const [isLoadingDocsSlides, setIsLoadingDocsSlides] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('Quant Execution Brief');
  const [newDocBody, setNewDocBody] = useState('Strategy: XAUUSD London Open Liquidity Sweep\nMax Risk: 0.5% per ticket.');
  const [selectedDoc, setSelectedDoc] = useState<GoogleDocSummary | null>(null);
  const [appendDocText, setAppendDocText] = useState('');

  const [newDeckTitle, setNewDeckTitle] = useState('Titan Quant Weekly Desk Review');
  const [selectedDeck, setSelectedDeck] = useState<GoogleSlideSummary | null>(null);
  const [newSlideHeading, setNewSlideHeading] = useState('Weekly Risk & Drawdown Summary');

  // ---------------------------------------------------------------------------
  // 4. FORMS STATE
  // ---------------------------------------------------------------------------
  const [formFiles, setFormFiles] = useState<WorkspaceDriveFileSummary[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('Pre-Trade Discipline Checklist');
  const [selectedForm, setSelectedForm] = useState<GoogleFormSummary | null>(null);
  const [formResponses, setFormResponses] = useState<GoogleFormResponseItem[]>([]);
  const [newQuestionTitle, setNewQuestionTitle] = useState('Did price sweep an Asian/London high or low?');

  // ---------------------------------------------------------------------------
  // 5. DESK NOTES (DRIVE-BACKED KEEP ALTERNATIVE) STATE
  // ---------------------------------------------------------------------------
  const [deskNotes, setDeskNotes] = useState<WorkspaceDriveFileSummary[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState('Desk Watchlist Note');
  const [noteContent, setNoteContent] = useState('Watch 2735.00 NY4 liquidity pool before FOMC.');
  const [selectedNote, setSelectedNote] = useState<GoogleDocSummary | null>(null);

  const showSuccess = (msg: string) => {
    setBannerError(null);
    setBannerSuccess(msg);
    setTimeout(() => setBannerSuccess(null), 4500);
  };

  const showError = (err: unknown) => {
    setBannerSuccess(null);
    setBannerError(err instanceof Error ? err.message : 'Google Workspace request failed.');
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard blocked
    }
  };

  // Sync Firebase Auth + In-Memory OAuth Token
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      const token = await getAccessToken();
      setAccessToken(token);
      if (!u) {
        setEvents([]);
        setContacts([]);
        setDocFiles([]);
        setSlideFiles([]);
        setFormFiles([]);
        setDeskNotes([]);
      }
    });
    return () => unsub();
  }, []);

  // Loaders per tab
  const loadCalendar = useCallback(async (token: string) => {
    setIsLoadingCalendar(true);
    try {
      const items = await listCalendarEvents(token, 12);
      setEvents(items);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

  const loadContactsAndProfile = useCallback(async (token: string) => {
    setIsLoadingContacts(true);
    try {
      const [profile, list] = await Promise.all([
        getMeProfile(token),
        listContacts(token),
      ]);
      setMeProfile(profile);
      setContacts(list);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  const loadDocsAndSlides = useCallback(async (token: string) => {
    setIsLoadingDocsSlides(true);
    try {
      const [docs, slides] = await Promise.all([
        listDriveFilesByMime(token, DOC_MIME),
        listDriveFilesByMime(token, SLIDE_MIME),
      ]);
      setDocFiles(docs);
      setSlideFiles(slides);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoadingDocsSlides(false);
    }
  }, []);

  const loadForms = useCallback(async (token: string) => {
    setIsLoadingForms(true);
    try {
      const forms = await listDriveFilesByMime(token, FORM_MIME);
      setFormFiles(forms);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoadingForms(false);
    }
  }, []);

  const loadDeskNotes = useCallback(async (token: string) => {
    setIsLoadingNotes(true);
    try {
      const notes = await listDriveFilesByMime(token, DOC_MIME, 'Titan Desk Note');
      setDeskNotes(notes);
    } catch (err) {
      showError(err);
    } finally {
      setIsLoadingNotes(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === 'CALENDAR') void loadCalendar(accessToken);
    if (activeTab === 'MEET_CONTACTS') void loadContactsAndProfile(accessToken);
    if (activeTab === 'DOCS_SLIDES') void loadDocsAndSlides(accessToken);
    if (activeTab === 'FORMS') void loadForms(accessToken);
    if (activeTab === 'KEEP_NOTES') void loadDeskNotes(accessToken);
  }, [
    accessToken,
    activeTab,
    loadCalendar,
    loadContactsAndProfile,
    loadDocsAndSlides,
    loadForms,
    loadDeskNotes,
  ]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setBannerError(null);
    try {
      const res = await signInWithGoogleWorkspace();
      setUser(res.user);
      setAccessToken(res.accessToken);
      if (!res.accessToken) {
        setBannerError('Google sign-in completed, but no OAuth access token was granted. Please re-authorize scopes.');
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutWorkspace();
    setUser(null);
    setAccessToken(null);
    setPendingConfirmation(null);
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    setIsConfirmExecuting(true);
    try {
      await pendingConfirmation.onConfirm();
      setPendingConfirmation(null);
    } catch (err) {
      showError(err);
      setPendingConfirmation(null);
    } finally {
      setIsConfirmExecuting(false);
    }
  };

  // Confirmation helper wrappers
  const requestCalendarCreate = () => {
    if (!accessToken || !newEventTitle.trim()) return;
    const startIso = new Date(`${newEventDate}T${newEventTime}:00`).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + 45 * 60000).toISOString();
    setPendingConfirmation({
      title: 'Confirm Calendar Event Creation',
      description: 'This will create a new event in your primary Google Calendar.',
      targetSummary: `${newEventTitle.trim()} on ${newEventDate} at ${newEventTime} (45 min)`,
      confirmLabel: 'Create Event',
      onConfirm: async () => {
        const created = await createCalendarEvent(accessToken, {
          summary: newEventTitle.trim(),
          description: newEventDesc.trim(),
          startIso,
          endIso,
        });
        setEvents((prev) => [created, ...prev]);
        showSuccess(`Created Calendar event "${created.summary}".`);
      },
    });
  };

  const requestCalendarUpdate = (eventId: string) => {
    if (!accessToken || !editingEventTitle.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Calendar Event Update',
      description: 'This will modify the title and notes of the selected Google Calendar event.',
      targetSummary: `${editingEventTitle.trim()} (ID: ${eventId})`,
      confirmLabel: 'Save Changes',
      onConfirm: async () => {
        const updated = await updateCalendarEvent(accessToken, eventId, {
          summary: editingEventTitle.trim(),
          description: editingEventDesc.trim(),
        });
        setEvents((prev) => prev.map((ev) => (ev.id === eventId ? updated : ev)));
        setEditingEventId(null);
        showSuccess(`Updated Calendar event "${updated.summary}".`);
      },
    });
  };

  const requestCalendarDelete = (ev: CalendarEventItem) => {
    if (!accessToken) return;
    setPendingConfirmation({
      title: 'Confirm Calendar Event Deletion',
      description: 'This permanently deletes the event from your primary Google Calendar.',
      targetSummary: `${ev.summary || 'Untitled Event'} (${ev.start.dateTime || ev.start.date || ''})`,
      isDestructive: true,
      confirmLabel: 'Delete Event',
      onConfirm: async () => {
        await deleteCalendarEvent(accessToken, ev.id);
        setEvents((prev) => prev.filter((item) => item.id !== ev.id));
        showSuccess(`Deleted Calendar event "${ev.summary}".`);
      },
    });
  };

  const requestCreateMeetSpace = () => {
    if (!accessToken) return;
    setPendingConfirmation({
      title: 'Confirm Google Meet Space Creation',
      description: 'This provisions a live Google Meet conference link on your Workspace account.',
      targetSummary: `New Google Meet room with ${newMeetAccess} access policy`,
      confirmLabel: 'Create Meet Space',
      onConfirm: async () => {
        const space = await createMeetSpace(accessToken, newMeetAccess);
        setMeetSpaces((prev) => [space, ...prev]);
        showSuccess(`Created Google Meet room (${space.meetingCode}).`);
      },
    });
  };

  const requestUpdateMeetAccess = (
    space: MeetSpaceItem,
    nextAccess: 'OPEN' | 'TRUSTED' | 'RESTRICTED'
  ) => {
    if (!accessToken) return;
    setPendingConfirmation({
      title: 'Confirm Meet Access Policy Change',
      description: 'This updates who can join the Google Meet room without knocking.',
      targetSummary: `Room ${space.meetingCode} -> ${nextAccess}`,
      confirmLabel: 'Update Access',
      onConfirm: async () => {
        const updated = await updateMeetSpaceAccess(accessToken, space.name, nextAccess);
        setMeetSpaces((prev) => prev.map((s) => (s.name === space.name ? updated : s)));
        showSuccess(`Updated room ${updated.meetingCode} access to ${nextAccess}.`);
      },
    });
  };

  const requestCreateContact = () => {
    if (!accessToken || !contactGivenName.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Google Contact Creation',
      description: 'This adds a new contact record to your Google Contacts address book.',
      targetSummary: `${contactGivenName.trim()} ${contactFamilyName.trim()} ${
        contactEmail.trim() ? `<${contactEmail.trim()}>` : ''
      }`,
      confirmLabel: 'Save Contact',
      onConfirm: async () => {
        const created = await createContact(accessToken, {
          givenName: contactGivenName.trim(),
          familyName: contactFamilyName.trim(),
          email: contactEmail.trim(),
          phoneNumber: contactPhone.trim(),
          organization: contactOrg.trim(),
        });
        setContacts((prev) => [created, ...prev]);
        setContactGivenName('');
        setContactFamilyName('');
        setContactEmail('');
        setContactPhone('');
        setContactOrg('');
        showSuccess(`Saved contact "${created.displayName}".`);
      },
    });
  };

  const requestDeleteContact = (c: WorkspaceContactItem) => {
    if (!accessToken) return;
    setPendingConfirmation({
      title: 'Confirm Contact Deletion',
      description: 'This permanently deletes the selected contact from your Google Contacts.',
      targetSummary: `${c.displayName}${c.email ? ` (${c.email})` : ''}`,
      isDestructive: true,
      confirmLabel: 'Delete Contact',
      onConfirm: async () => {
        await deleteContact(accessToken, c.resourceName);
        setContacts((prev) => prev.filter((item) => item.resourceName !== c.resourceName));
        showSuccess(`Deleted contact "${c.displayName}".`);
      },
    });
  };

  const requestCreateDoc = () => {
    if (!accessToken || !newDocTitle.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Google Doc Creation',
      description: 'This creates a new document inside your Google Drive via the Google Docs API.',
      targetSummary: `Document "${newDocTitle.trim()}"`,
      confirmLabel: 'Create Document',
      onConfirm: async () => {
        const doc = await createGoogleDoc(accessToken, newDocTitle.trim(), newDocBody);
        setSelectedDoc(doc);
        await loadDocsAndSlides(accessToken);
        showSuccess(`Created Google Doc "${doc.title}".`);
      },
    });
  };

  const requestAppendDoc = () => {
    if (!accessToken || !selectedDoc || !appendDocText.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Google Doc Update',
      description: 'This appends a new paragraph to the selected Google Doc.',
      targetSummary: `Append text to "${selectedDoc.title}"`,
      confirmLabel: 'Append Text',
      onConfirm: async () => {
        await appendGoogleDocText(accessToken, selectedDoc.documentId, appendDocText.trim());
        const refreshed = await getGoogleDoc(accessToken, selectedDoc.documentId);
        setSelectedDoc(refreshed);
        setAppendDocText('');
        showSuccess(`Appended briefing entry to "${refreshed.title}".`);
      },
    });
  };

  const requestCreateSlideDeck = () => {
    if (!accessToken || !newDeckTitle.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Google Slides Presentation Creation',
      description: 'This creates a new presentation deck in your Google Drive.',
      targetSummary: `Presentation "${newDeckTitle.trim()}"`,
      confirmLabel: 'Create Deck',
      onConfirm: async () => {
        const deck = await createGoogleSlideDeck(accessToken, newDeckTitle.trim());
        setSelectedDeck(deck);
        await loadDocsAndSlides(accessToken);
        showSuccess(`Created Google Slides deck "${deck.title}".`);
      },
    });
  };

  const requestAddSlide = () => {
    if (!accessToken || !selectedDeck || !newSlideHeading.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Add Slide to Presentation',
      description: 'This inserts a new TITLE_AND_BODY slide into your Google Slides deck.',
      targetSummary: `Slide "${newSlideHeading.trim()}" -> "${selectedDeck.title}"`,
      confirmLabel: 'Add Slide',
      onConfirm: async () => {
        const updated = await addSlideToDeck(
          accessToken,
          selectedDeck.presentationId,
          newSlideHeading.trim()
        );
        setSelectedDeck(updated);
        showSuccess(`Added slide "${newSlideHeading.trim()}" to "${updated.title}".`);
      },
    });
  };

  const requestCreateForm = () => {
    if (!accessToken || !newFormTitle.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Google Form Creation',
      description: 'This creates a new interactive Google Form in your Drive.',
      targetSummary: `Form "${newFormTitle.trim()}"`,
      confirmLabel: 'Create Form',
      onConfirm: async () => {
        const form = await createGoogleForm(accessToken, newFormTitle.trim());
        setSelectedForm(form);
        setFormResponses([]);
        await loadForms(accessToken);
        showSuccess(`Created Google Form "${form.title}".`);
      },
    });
  };

  const requestAddFormQuestion = () => {
    if (!accessToken || !selectedForm || !newQuestionTitle.trim()) return;
    setPendingConfirmation({
      title: 'Confirm Add Form Question',
      description: 'This adds a new question item to your Google Form.',
      targetSummary: `"${newQuestionTitle.trim()}" -> "${selectedForm.title}"`,
      confirmLabel: 'Add Question',
      onConfirm: async () => {
        const updated = await addFormQuestion(
          accessToken,
          selectedForm.formId,
          newQuestionTitle.trim()
        );
        setSelectedForm(updated);
        showSuccess(`Added question to "${updated.title}".`);
      },
    });
  };

  const requestCreateDeskNote = () => {
    if (!accessToken || !noteTitle.trim()) return;
    const normalizedTitle = noteTitle.trim().startsWith('Titan Desk Note')
      ? noteTitle.trim()
      : `Titan Desk Note: ${noteTitle.trim()}`;
    setPendingConfirmation({
      title: 'Confirm Desk Note Creation',
      description:
        'Creates a persistent Google Docs desk note in your Drive (consumer-safe Keep alternative).',
      targetSummary: normalizedTitle,
      confirmLabel: 'Save Desk Note',
      onConfirm: async () => {
        const created = await createGoogleDoc(accessToken, normalizedTitle, noteContent.trim());
        setSelectedNote(created);
        await loadDeskNotes(accessToken);
        showSuccess(`Saved Desk Note "${created.title}".`);
      },
    });
  };

  const requestDeleteDriveNote = (file: WorkspaceDriveFileSummary) => {
    if (!accessToken) return;
    setPendingConfirmation({
      title: 'Confirm Desk Note Deletion',
      description: 'This permanently deletes the Desk Note file from your Google Drive.',
      targetSummary: file.name,
      isDestructive: true,
      confirmLabel: 'Delete Note',
      onConfirm: async () => {
        await deleteDriveFile(accessToken, file.id);
        setDeskNotes((prev) => prev.filter((n) => n.id !== file.id));
        if (selectedNote?.documentId === file.id) {
          setSelectedNote(null);
        }
        showSuccess(`Deleted Desk Note "${file.name}".`);
      },
    });
  };

  const subTabs: Array<{ id: WorkspaceSubTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'CALENDAR', label: 'Calendar', icon: Calendar },
    { id: 'MEET_CONTACTS', label: 'Meet & Contacts', icon: Users },
    { id: 'DOCS_SLIDES', label: 'Docs & Slides', icon: FileText },
    { id: 'FORMS', label: 'Forms', icon: ClipboardList },
    { id: 'KEEP_NOTES', label: 'Keep & Desk Notes', icon: StickyNote },
  ];

  // Unauthenticated / Expired Session Gate with Official Google Sign-In Button
  if (!user || !accessToken) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-[#0F141E] border border-white/10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-cyan-400 font-semibold">{brand.brandName} · Workspace OAuth 2.0</span>
              <span aria-hidden="true">·</span>
              <span>{brand.ownerEntity}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {brand.brandName} Google Workspace Hub
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect your Google account to manage trading desk Calendar events, provision Google Meet briefing rooms, organize Contacts, author Google Docs and Slides decks, collect Google Forms evaluations, and store Drive-backed Desk Notes.
            </p>
            <p className="text-xs text-slate-400">
              Access tokens remain strictly in browser memory for your current session and are never persisted to disk or local storage.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
              </div>
            </button>

            {user && !accessToken && (
              <span className="text-xs text-amber-300">
                Session restored for {user.email}. Click Sign in with Google to authorize live Workspace API access.
              </span>
            )}
          </div>
        </div>

        {bannerError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bannerError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <Calendar className="w-4 h-4" />
              <span>Calendar &amp; Meet Rooms</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Schedule session catalysts, edit desk briefings, and generate Google Meet links with configurable access policies.
            </p>
          </div>
          <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <FileText className="w-4 h-4" />
              <span>Docs, Slides &amp; Forms</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create and append strategy briefs, build weekly review slide decks, and manage trader evaluation forms.
            </p>
          </div>
          <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Users className="w-4 h-4" />
              <span>Contacts &amp; Desk Notes</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage People API contacts and Drive-backed desk notes with explicit confirmation before any write or delete.
            </p>
          </div>
        </div>

        <GoogleDriveIntegrationCard />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="rounded-xl bg-[#0F141E] border border-white/10 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight">
              {brand.brandName} Workspace Hub
            </h1>
            <span className="text-xs font-semibold text-emerald-400">
              · OAuth Active · {brand.ownerEntity}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connected as <span className="text-slate-200 font-medium">{user.displayName || user.email}</span>
            {user.email ? ` (${user.email})` : ''} • Confirmations required for all Workspace mutations
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (!accessToken) return;
              if (activeTab === 'CALENDAR') void loadCalendar(accessToken);
              if (activeTab === 'MEET_CONTACTS') void loadContactsAndProfile(accessToken);
              if (activeTab === 'DOCS_SLIDES') void loadDocsAndSlides(accessToken);
              if (activeTab === 'FORMS') void loadForms(accessToken);
              if (activeTab === 'KEEP_NOTES') void loadDeskNotes(accessToken);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#161D2B] hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Refresh Active Tab</span>
          </button>

          <button
            type="button"
            onClick={handleSignOut}
            className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banners */}
      {bannerError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{bannerError}</span>
          </div>
          <button type="button" onClick={() => setBannerError(null)} className="text-rose-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {bannerSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
          <button type="button" onClick={() => setBannerSuccess(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 border transition ${
                active
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-[#0F141E] text-slate-300 border-white/10 hover:bg-[#161D2B]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =======================================================================
          TAB 1: GOOGLE CALENDAR
          ======================================================================= */}
      {activeTab === 'CALENDAR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Create Event Panel */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Schedule Calendar Event</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="button"
                onClick={requestCalendarCreate}
                disabled={!newEventTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create Calendar Event</span>
              </button>
            </div>
          </div>

          {/* Upcoming Events List */}
          <div className="lg:col-span-7 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Upcoming Primary Calendar Events</h2>
              {isLoadingCalendar && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            {events.length === 0 ? (
              <div className="p-8 rounded-lg bg-[#161D2B] border border-white/5 text-center text-xs text-slate-400">
                No upcoming events found on your primary calendar.
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-lg bg-[#161D2B] border border-white/10 space-y-2.5"
                  >
                    {editingEventId === ev.id ? (
                      <div className="space-y-2.5 text-xs">
                        <input
                          type="text"
                          value={editingEventTitle}
                          onChange={(e) => setEditingEventTitle(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-[#0F141E] border border-white/15 text-white"
                        />
                        <textarea
                          rows={2}
                          value={editingEventDesc}
                          onChange={(e) => setEditingEventDesc(e.target.value)}
                          className="w-full px-3 py-1.5 rounded bg-[#0F141E] border border-white/15 text-white"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => requestCalendarUpdate(ev.id)}
                            className="px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold"
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingEventId(null)}
                            className="px-3 py-1.5 rounded bg-slate-800 text-slate-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white">
                              {ev.summary || 'Untitled Event'}
                            </h3>
                            <p className="text-xs text-cyan-300 font-mono tabular-nums mt-0.5">
                              {ev.start.dateTime
                                ? new Date(ev.start.dateTime).toLocaleString()
                                : ev.start.date || 'All Day'}
                            </p>
                            {ev.description && (
                              <p className="text-xs text-slate-400 mt-1">{ev.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEventId(ev.id);
                                setEditingEventTitle(ev.summary || '');
                                setEditingEventDesc(ev.description || '');
                              }}
                              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit Event"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestCalendarDelete(ev)}
                              className="p-1.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                                title="Open in Google Calendar"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: GOOGLE MEET & CONTACTS
          ======================================================================= */}
      {activeTab === 'MEET_CONTACTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Google Meet Room Generator */}
          <div className="lg:col-span-5 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Google Meet Briefing Rooms</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Room Access Policy</label>
                <select
                  value={newMeetAccess}
                  onChange={(e) =>
                    setNewMeetAccess(e.target.value as 'TRUSTED' | 'OPEN' | 'RESTRICTED')
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="TRUSTED">TRUSTED (Org &amp; Invited Guests)</option>
                  <option value="OPEN">OPEN (Anyone with Link)</option>
                  <option value="RESTRICTED">RESTRICTED (Invited Only)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={requestCreateMeetSpace}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create Google Meet Space</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Provisioned Meet Spaces ({meetSpaces.length})
              </span>
              {meetSpaces.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No spaces created in this session yet.
                </p>
              ) : (
                meetSpaces.map((space) => (
                  <div
                    key={space.name}
                    className="p-3.5 rounded-lg bg-[#161D2B] border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold text-white">{space.meetingCode}</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 text-[10px] font-semibold">
                        {space.config?.accessType || 'TRUSTED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400 font-mono truncate">{space.meetingUri}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleCopy(space.meetingUri, space.name)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                          title="Copy Meet URL"
                        >
                          {copiedId === space.name ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={space.meetingUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300"
                          title="Open Meet Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      {(['TRUSTED', 'OPEN', 'RESTRICTED'] as const).map((policy) => (
                        <button
                          key={policy}
                          type="button"
                          onClick={() => requestUpdateMeetAccess(space, policy)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold border transition ${
                            space.config?.accessType === policy
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                              : 'bg-[#0F141E] border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          {policy}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Google Contacts (People API) */}
          <div className="lg:col-span-7 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Google Contacts (People API)</span>
                </h2>
                {meProfile && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Signed-in profile: {meProfile.displayName} {meProfile.email ? `(${meProfile.email})` : ''}
                  </p>
                )}
              </div>
              {isLoadingContacts && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            {/* Add Contact Form */}
            <div className="p-4 rounded-lg bg-[#161D2B] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <input
                type="text"
                placeholder="First name *"
                value={contactGivenName}
                onChange={(e) => setContactGivenName(e.target.value)}
                className="px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Last name"
                value={contactFamilyName}
                onChange={(e) => setContactFamilyName(e.target.value)}
                className="px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <input
                type="email"
                placeholder="Email address"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Phone number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <input
                type="text"
                placeholder="Desk / Organization"
                value={contactOrg}
                onChange={(e) => setContactOrg(e.target.value)}
                className="px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white sm:col-span-2"
              />
              <button
                type="button"
                onClick={requestCreateContact}
                disabled={!contactGivenName.trim()}
                className="sm:col-span-2 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Add Google Contact</span>
              </button>
            </div>

            {/* Contact List */}
            {contacts.length === 0 ? (
              <div className="p-6 rounded-lg bg-[#161D2B] border border-white/5 text-center text-xs text-slate-400">
                No contacts returned from People API yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {contacts.map((c) => (
                  <div
                    key={c.resourceName}
                    className="p-3 rounded-lg bg-[#161D2B] border border-white/10 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{c.displayName}</div>
                      {c.organization && (
                        <div className="text-[11px] text-cyan-300 truncate">{c.organization}</div>
                      )}
                      {c.email && <div className="text-slate-400 truncate">{c.email}</div>}
                      {c.phoneNumber && (
                        <div className="text-slate-400 font-mono truncate">{c.phoneNumber}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => requestDeleteContact(c)}
                      className="p-1.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 shrink-0"
                      title="Delete Contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: GOOGLE DOCS & SLIDES
          ======================================================================= */}
      {activeTab === 'DOCS_SLIDES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* GOOGLE DOCS */}
          <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Google Docs Strategy Briefs</span>
              </h2>
              {isLoadingDocsSlides && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            <div className="p-3.5 rounded-lg bg-[#161D2B] border border-white/10 space-y-2.5 text-xs">
              <input
                type="text"
                placeholder="Document title"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <textarea
                rows={3}
                placeholder="Initial document body"
                value={newDocBody}
                onChange={(e) => setNewDocBody(e.target.value)}
                className="w-full px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <button
                type="button"
                onClick={requestCreateDoc}
                disabled={!newDocTitle.trim()}
                className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create Google Doc</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {docFiles.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-[#161D2B] border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (!accessToken) return;
                      try {
                        const doc = await getGoogleDoc(accessToken, f.id);
                        setSelectedDoc(doc);
                      } catch (err) {
                        showError(err);
                      }
                    }}
                    className="text-left font-medium text-white hover:text-cyan-300 truncate flex-1"
                  >
                    {f.name}
                  </button>
                  {f.webViewLink && (
                    <a
                      href={f.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-slate-800 text-cyan-300 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {selectedDoc && (
              <div className="p-4 rounded-lg bg-[#090C12] border border-blue-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{selectedDoc.title}</span>
                  <span className="font-mono text-[10px] text-slate-400">{selectedDoc.documentId}</span>
                </div>
                <pre className="whitespace-pre-wrap text-slate-300 font-sans text-xs max-h-40 overflow-y-auto bg-[#0F141E] p-3 rounded border border-white/5">
                  {selectedDoc.plainText || '(Empty document)'}
                </pre>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Append new line to document..."
                    value={appendDocText}
                    onChange={(e) => setAppendDocText(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded bg-[#161D2B] border border-white/10 text-white"
                  />
                  <button
                    type="button"
                    onClick={requestAppendDoc}
                    disabled={!appendDocText.trim()}
                    className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shrink-0 disabled:opacity-50"
                  >
                    Append
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* GOOGLE SLIDES */}
          <div className="rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Presentation className="w-4 h-4 text-amber-400" />
                <span>Google Slides Pitch &amp; Review Decks</span>
              </h2>
              {isLoadingDocsSlides && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            <div className="p-3.5 rounded-lg bg-[#161D2B] border border-white/10 flex items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="New presentation title"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded bg-[#0F141E] border border-white/10 text-white"
              />
              <button
                type="button"
                onClick={requestCreateSlideDeck}
                disabled={!newDeckTitle.trim()}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                Create Deck
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {slideFiles.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-lg bg-[#161D2B] border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (!accessToken) return;
                      try {
                        const deck = await getGoogleSlideDeck(accessToken, f.id);
                        setSelectedDeck(deck);
                      } catch (err) {
                        showError(err);
                      }
                    }}
                    className="text-left font-medium text-white hover:text-amber-300 truncate flex-1"
                  >
                    {f.name}
                  </button>
                  {f.webViewLink && (
                    <a
                      href={f.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-slate-800 text-amber-300 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>

            {selectedDeck && (
              <div className="p-4 rounded-lg bg-[#090C12] border border-amber-500/30 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{selectedDeck.title}</span>
                  <span className="font-mono text-amber-300">{selectedDeck.slideCount} slides</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {selectedDeck.slides.map((s, idx) => (
                    <div
                      key={s.objectId}
                      className="p-2.5 rounded bg-[#0F141E] border border-white/5 text-slate-300"
                    >
                      <span className="font-mono text-[10px] text-slate-500 mr-2">#{idx + 1}</span>
                      <span>{s.previewText}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New slide heading..."
                    value={newSlideHeading}
                    onChange={(e) => setNewSlideHeading(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded bg-[#161D2B] border border-white/10 text-white"
                  />
                  <button
                    type="button"
                    onClick={requestAddSlide}
                    disabled={!newSlideHeading.trim()}
                    className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shrink-0 disabled:opacity-50"
                  >
                    Add Slide
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: GOOGLE FORMS
          ======================================================================= */}
      {activeTab === 'FORMS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-sky-400" />
                <span>Google Forms &amp; Checklists</span>
              </h2>
              {isLoadingForms && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <input
                type="text"
                placeholder="New Google Form title"
                value={newFormTitle}
                onChange={(e) => setNewFormTitle(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white"
              />
              <button
                type="button"
                onClick={requestCreateForm}
                disabled={!newFormTitle.trim()}
                className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold whitespace-nowrap shrink-0 disabled:opacity-50"
              >
                Create Form
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {formFiles.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#161D2B] border border-white/5 text-center text-xs text-slate-400">
                  No Google Forms found yet. Create one above to start collecting submissions.
                </div>
              ) : (
                formFiles.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg bg-[#161D2B] border border-white/10 flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={async () => {
                        if (!accessToken) return;
                        try {
                          const [form, resps] = await Promise.all([
                            getGoogleForm(accessToken, f.id),
                            listFormResponses(accessToken, f.id),
                          ]);
                          setSelectedForm(form);
                          setFormResponses(resps);
                        } catch (err) {
                          showError(err);
                        }
                      }}
                      className="text-left font-medium text-white hover:text-sky-300 truncate flex-1"
                    >
                      {f.name}
                    </button>
                    {f.webViewLink && (
                      <a
                        href={f.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded bg-slate-800 text-sky-300 shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-4">
            {!selectedForm ? (
              <div className="p-10 rounded-lg bg-[#161D2B] border border-white/5 text-center text-xs text-slate-400">
                Select or create a Google Form on the left to inspect questions, add items, and read live responses.
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedForm.title}</h3>
                    <span className="font-mono text-[11px] text-slate-400">{selectedForm.formId}</span>
                  </div>
                  {selectedForm.responderUri && (
                    <button
                      type="button"
                      onClick={() => void handleCopy(selectedForm.responderUri!, selectedForm.formId)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold flex items-center gap-1.5 shrink-0"
                    >
                      {copiedId === selectedForm.formId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy Responder URL</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="New short-answer question prompt..."
                    value={newQuestionTitle}
                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white"
                  />
                  <button
                    type="button"
                    onClick={requestAddFormQuestion}
                    disabled={!newQuestionTitle.trim()}
                    className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold shrink-0 disabled:opacity-50"
                  >
                    Add Question
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Form Questions ({selectedForm.questions.length})
                  </span>
                  {selectedForm.questions.length === 0 ? (
                    <p className="text-slate-500">No questions added yet.</p>
                  ) : (
                    selectedForm.questions.map((q, idx) => (
                      <div
                        key={q.itemId}
                        className="p-2.5 rounded bg-[#161D2B] border border-white/5 flex items-center justify-between"
                      >
                        <span className="text-slate-200">
                          {idx + 1}. {q.title}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.kind}</span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Submitted Responses ({formResponses.length})
                  </span>
                  {formResponses.length === 0 ? (
                    <p className="text-slate-500">No responses submitted yet.</p>
                  ) : (
                    formResponses.map((r) => (
                      <div
                        key={r.responseId}
                        className="p-3 rounded bg-[#161D2B] border border-white/5 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>{r.respondentEmail || 'Anonymous Respondent'}</span>
                          <span className="font-mono">
                            {r.createTime ? new Date(r.createTime).toLocaleString() : ''}
                          </span>
                        </div>
                        <div className="text-slate-200">{r.answersSummary.join(' • ') || 'No text answers'}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 5: KEEP & DRIVE-BACKED DESK NOTES + GOOGLE DRIVE PICKER
          ======================================================================= */}
      {activeTab === 'KEEP_NOTES' && (
        <div className="space-y-5">
          {/* Explicit Keep Enterprise Prerequisite Notice */}
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3 text-xs text-amber-200">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-amber-300">
                Google Keep API Enterprise Scope Requirement
              </div>
              <p className="text-amber-100/80 leading-relaxed">
                Google Keep REST API scopes require Google Workspace Enterprise Domain-Wide Delegation (service account impersonation) and cannot be granted via standard consumer OAuth popups. To keep full note persistence working for all accounts, Desk Notes below store directly as Google Docs inside your Google Drive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <span>Create Persistent Desk Note</span>
              </h2>
              <input
                type="text"
                placeholder="Note title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white"
              />
              <textarea
                rows={4}
                placeholder="Write trading rules, catalysts, or setup levels..."
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#161D2B] border border-white/10 text-white"
              />
              <button
                type="button"
                onClick={requestCreateDeskNote}
                disabled={!noteTitle.trim()}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Save Desk Note to Drive</span>
              </button>
            </div>

            <div className="lg:col-span-7 rounded-xl bg-[#0F141E] border border-white/10 p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Saved Desk Notes ({deskNotes.length})</h2>
                {isLoadingNotes && <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />}
              </div>

              {deskNotes.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#161D2B] border border-white/5 text-center text-slate-400">
                  No Desk Notes saved yet. Create one on the left to store it directly in your Google Drive.
                </div>
              ) : (
                <div className="space-y-2">
                  {deskNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-lg bg-[#161D2B] border border-white/10 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={async () => {
                          if (!accessToken) return;
                          try {
                            const doc = await getGoogleDoc(accessToken, n.id);
                            setSelectedNote(doc);
                          } catch (err) {
                            showError(err);
                          }
                        }}
                        className="text-left font-medium text-white hover:text-amber-300 truncate flex-1"
                      >
                        {n.name}
                      </button>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => requestDeleteDriveNote(n)}
                          className="p-1.5 rounded bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                          title="Delete Desk Note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {n.webViewLink && (
                          <a
                            href={n.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-slate-800 text-amber-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedNote && (
                <div className="p-4 rounded-lg bg-[#090C12] border border-amber-500/30 space-y-2">
                  <div className="font-bold text-white">{selectedNote.title}</div>
                  <pre className="whitespace-pre-wrap text-slate-300 font-sans text-xs">
                    {selectedNote.plainText || '(Empty note)'}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <GoogleDriveIntegrationCard />
        </div>
      )}

      {/* =======================================================================
          MANDATORY CONFIRMATION MODAL FOR ALL MUTATING / DESTRUCTIVE ACTIONS
          ======================================================================= */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-[#0F141E] border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  pendingConfirmation.isDestructive
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-cyan-500/15 text-cyan-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{pendingConfirmation.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {pendingConfirmation.description}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#161D2B] border border-white/10 text-xs text-slate-200 font-mono break-words">
              {pendingConfirmation.targetSummary}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isConfirmExecuting}
                onClick={() => setPendingConfirmation(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConfirmExecuting}
                onClick={() => void executeConfirmedAction()}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 ${
                  pendingConfirmation.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                }`}
              >
                {isConfirmExecuting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{pendingConfirmation.confirmLabel}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
