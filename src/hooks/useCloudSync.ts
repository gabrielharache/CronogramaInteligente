import { useState, useEffect, useMemo, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { AppState } from '../types';
import {
  loadLocalUserState,
  fetchUserState,
  saveLocalUserState,
  saveCloudUserState,
  getInitialState,
  getEmptyUserState
} from '../utils/storage';

// Local draft persistence + Supabase sync: 30s auto-save, manual save (Ctrl+S), discard and reset
export function useCloudSync(
  state: AppState,
  setState: Dispatch<SetStateAction<AppState>>,
  userId?: string
) {
  const [lastSavedState, setLastSavedState] = useState<AppState>(() => loadLocalUserState(userId));
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState<number | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const lastSavedStateRef = useRef(lastSavedState);
  lastSavedStateRef.current = lastSavedState;
  const isSavingRef = useRef(isSaving);
  isSavingRef.current = isSaving;

  // Determine if there are pending unsaved changes compared to the cloud version
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(state) !== JSON.stringify(lastSavedState);
  }, [state, lastSavedState]);

  // Sync state with cloud when user logs in or mounts
  useEffect(() => {
    let isMounted = true;
    if (userId) {
      fetchUserState(userId).then(({ state: cloudState, updatedAt }) => {
        if (isMounted && cloudState) {
          setState(cloudState);
          setLastSavedState(cloudState);
          if (updatedAt) {
            setLastSavedAt(new Date(updatedAt));
          } else {
            setLastSavedAt(new Date());
          }
        }
      }).catch(err => {
        console.error('Error fetching cloud state:', err);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Always update local storage draft immediately so browser refresh/crash never loses data
  useEffect(() => {
    saveLocalUserState(state, userId);
  }, [state, userId]);

  // Core save routine to Supabase
  const executeCloudSave = useCallback(async (stateToSave: AppState) => {
    if (isSavingRef.current) return;
    setIsSaving(true);
    try {
      const res = await saveCloudUserState(stateToSave, userId);
      if (res.success) {
        setLastSavedState(stateToSave);
        setLastSavedAt(res.updatedAt ? new Date(res.updatedAt) : new Date());
        setAutoSaveCountdown(null);
      }
    } catch (err) {
      console.error('Error saving state to Supabase:', err);
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  // Manual save trigger (Header button or Ctrl+S)
  const handleManualSave = useCallback(() => {
    if (!hasUnsavedChanges || isSavingRef.current) return;
    executeCloudSave(stateRef.current);
  }, [hasUnsavedChanges, executeCloudSave]);

  // Revert/discard changes to last saved cloud state
  const handleDiscardChanges = useCallback(() => {
    if (!hasUnsavedChanges) return;
    const restored = lastSavedStateRef.current;
    setState(restored);
    saveLocalUserState(restored, userId);
    setAutoSaveCountdown(null);
  }, [hasUnsavedChanges, userId]);

  // 30-second Auto-save mechanism with visual countdown
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setAutoSaveCountdown(null);
      return;
    }

    const AUTO_SAVE_SECONDS = 30;
    setAutoSaveCountdown(AUTO_SAVE_SECONDS);

    const countdownInterval = setInterval(() => {
      setAutoSaveCountdown(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoSaveTimer = setTimeout(() => {
      executeCloudSave(stateRef.current);
    }, AUTO_SAVE_SECONDS * 1000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(autoSaveTimer);
    };
  }, [hasUnsavedChanges, state, executeCloudSave]);

  // Shortcut: Ctrl+S / Cmd+S to save manually
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (hasUnsavedChanges && !isSavingRef.current) {
          executeCloudSave(stateRef.current);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, executeCloudSave]);

  // Warn user when closing tab if there are unsaved cloud changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleResetToInitial = useCallback(async () => {
    const initial = userId ? getEmptyUserState() : getInitialState();
    setState(initial);
    saveLocalUserState(initial, userId);
    await executeCloudSave(initial);
  }, [userId, executeCloudSave]);

  return {
    isSaving,
    hasUnsavedChanges,
    lastSavedAt,
    autoSaveCountdown,
    handleManualSave,
    handleDiscardChanges,
    handleResetToInitial
  };
}
