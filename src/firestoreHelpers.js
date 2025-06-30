import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { auth } from './firebase';

// Save a company for the current user
export async function saveCompany(company) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'companies', company.id.toString()), company);
}

// Get all companies for the current user
export async function getCompanies() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'companies'));
  return snapshot.docs.map(doc => doc.data());
}

// Delete a company
export async function deleteCompany(companyId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'companies', companyId.toString()));
}

// --- PACKAGE HELPERS ---
export async function savePackages(packages) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'packages'), { packages });
}
export async function getPackages() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'packages');
  return meta ? meta.data().packages : { 'SEO - BASIC': [], 'SEO - PREMIUM': [], 'SEO - PRO': [], 'SEO - ULTIMATE': [] };
}
// --- TEMPLATE HELPERS ---
export async function saveTemplate(template) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'templates', template.id.toString()), template);
}
export async function getTemplates() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'templates'));
  return snapshot.docs.map(doc => doc.data());
}
export async function deleteTemplate(templateId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'templates', templateId.toString()));
}
// --- TICKET HELPERS ---
export async function saveTicket(ticket) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'tickets', ticket.id.toString()), ticket);
}
export async function getTickets() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'tickets'));
  return snapshot.docs.map(doc => doc.data());
}
export async function deleteTicket(ticketId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'tickets', ticketId.toString()));
}
// --- TRASH HELPERS ---
export async function saveTrash(trash) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'trash'), { trash });
}
export async function getTrash() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const docSnap = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = docSnap.docs.find(d => d.id === 'trash');
  return meta ? meta.data().trash : [];
}

// Update a specific audit status field for a company
export async function updateCompanyAuditStatus(companyId, field, value) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const companyRef = doc(db, 'users', user.uid, 'companies', companyId.toString());
  await setDoc(companyRef, { [field]: value }, { merge: true });
}

// --- RESOURCE HELPERS ---
export async function getResources() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'resources'));
  return snapshot.docs.map(doc => doc.data());
}

export async function saveResource(resource) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'resources', resource.id), resource);
}

export async function deleteResource(resourceId) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await deleteDoc(doc(db, 'users', user.uid, 'resources', resourceId));
}

// --- RESOURCE SECTION HELPERS ---
export async function getResourceSections() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  const snapshot = await getDocs(collection(db, 'users', user.uid, 'meta'));
  const meta = snapshot.docs.find(d => d.id === 'resourceSections');
  return meta ? meta.data().sections : ['Site Audit', 'Keyword Research', 'Other Sheets'];
}

export async function saveResourceSections(sections) {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  await setDoc(doc(db, 'users', user.uid, 'meta', 'resourceSections'), { sections });
} 