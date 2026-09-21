import React from 'react';
import { captureRef } from 'react-native-view-shot';
import { Share, View } from 'react-native';

export async function shareVerseAsImage(viewRef: React.RefObject<any>): Promise<void> {
  try {
    if (!viewRef.current) return;
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 0.9,
      result: 'tmpfile',
    });
    await Share.share({
      url: uri,
      message: 'Shared from Bible Unlock — bibleunlock.app',
    });
  } catch (error: any) {
    if (error?.message !== 'User did not share') {
      console.warn('[ShareVerse] Capture or share failed:', error);
    }
  }
}
