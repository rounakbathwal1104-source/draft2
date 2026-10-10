import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { ReportPayload } from '../types';

export async function submitReport(payload: ReportPayload): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be authenticated to report content.');

  const reportsCol = collection(db, 'reports');
  const reportDoc = doc(reportsCol);
  const path = `reports/${reportDoc.id}`;

  try {
    const reportData: any = {
      reporterId: user.uid,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      createdAt: serverTimestamp(),
    };

    if (payload.details && payload.details.trim()) {
      reportData.details = payload.details.trim().slice(0, 300);
    }

    await setDoc(reportDoc, reportData);
    return reportDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
