import { WasteRecord } from '../types';
import { GOOGLE_SHEET_ID, GOOGLE_DRIVE_FOLDER_ID } from '../constants';

const API_URL = 'https://script.google.com/macros/s/AKfycbx3VsE8S2aVJD2bnfCkSBKb9L1edqvR6mh0tj5xHWVVZ-uW9ahFq2n2rm1ugazslquZwg/exec';

export const checkConnection = async (): Promise<boolean> => {
  try {
    // Ping with action=ping to verify GAS is responding
    const response = await fetch(`${API_URL}?action=ping`);
    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
};

export const fetchAllRecords = async (): Promise<WasteRecord[]> => {
  try {
    const response = await fetch(`${API_URL}?action=getRecords&sheetId=${GOOGLE_SHEET_ID}`);
    const data = await response.json();
    if (data.status === 'success') {
      return data.data;
    }
    throw new Error(data.message || 'Failed to fetch records');
  } catch (error) {
    console.error('Fetch records failed:', error);
    throw error;
  }
};

export const saveRecord = async (record: WasteRecord): Promise<boolean> => {
  try {
    // Use URLSearchParams for application/x-www-form-urlencoded which GAS handles well
    const params = new URLSearchParams();
    params.append('action', 'saveRecord');
    params.append('sheetId', GOOGLE_SHEET_ID);
    params.append('data', JSON.stringify(record));

    const response = await fetch(API_URL, {
      method: 'POST',
      body: params,
    });
    
    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(result.message);
    }
    return true;
  } catch (error) {
    console.error('Save record failed:', error);
    throw error;
  }
};

export const deleteRecord = async (id: string): Promise<boolean> => {
  try {
    const params = new URLSearchParams();
    params.append('action', 'deleteRecord');
    params.append('sheetId', GOOGLE_SHEET_ID);
    params.append('id', id);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: params,
    });

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Delete record failed:', error);
    throw error;
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        // Remove "data:image/jpeg;base64," prefix
        const base64Data = (reader.result as string).split(',')[1];
        
        const params = new URLSearchParams();
        params.append('action', 'uploadImage');
        params.append('folderId', GOOGLE_DRIVE_FOLDER_ID);
        params.append('data', base64Data);
        params.append('mimeType', file.type);
        params.append('filename', file.name);

        const response = await fetch(API_URL, {
          method: 'POST',
          body: params,
        });

        const result = await response.json();
        if (result.status === 'success') {
          resolve(result.url);
        } else {
          reject(new Error(result.message || 'Upload failed'));
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};