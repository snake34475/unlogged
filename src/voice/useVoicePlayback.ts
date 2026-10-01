import { useCallback, useEffect, useRef, useState } from "react";
import manifest from "./manifest.json";

const clips = manifest as Record<string, string>;

export function hasVoiceClip(id: string, text: string): boolean {
  return clips[id] === text;
}

export function hasAnyVoiceClips(): boolean {
  return Object.keys(clips).length > 0;
}

export function useVoicePlayback(id: string, text: string, automatic: boolean, blocked: boolean) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const autoPlayed = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [needsGesture, setNeedsGesture] = useState(false);
  const available = hasVoiceClip(id, text);

  const play = useCallback(() => {
    const player = audio.current;
    if (!player) return;
    if (player.ended) player.currentTime = 0;
    autoPlayed.current = id;
    void player.play().then(() => setNeedsGesture(false)).catch((error: unknown) => {
      if (autoPlayed.current === id) autoPlayed.current = null;
      if (error instanceof DOMException && error.name === "NotAllowedError") setNeedsGesture(true);
      setPlaying(false);
    });
  }, [id]);

  useEffect(() => {
    const previous = audio.current;
    if (previous) {
      previous.pause();
      previous.currentTime = 0;
    }
    setPlaying(false);
    setNeedsGesture(false);
    if (!available) {
      audio.current = null;
      return;
    }
    const player = new Audio(`${import.meta.env.BASE_URL}voice/chapter01/${id}.mp3`);
    player.preload = "none";
    player.onended = () => setPlaying(false);
    player.onpause = () => setPlaying(false);
    player.onplay = () => setPlaying(true);
    player.onerror = () => setPlaying(false);
    audio.current = player;
    return () => {
      player.pause();
      player.onended = null;
      player.onpause = null;
      player.onplay = null;
      player.onerror = null;
    };
  }, [id, available]);

  useEffect(() => {
    if (blocked) audio.current?.pause();
  }, [blocked]);

  useEffect(() => {
    if (!automatic || blocked || !available || autoPlayed.current === id) return;
    play();
  }, [id, automatic, blocked, available, play]);

  const toggle = () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) {
      player.pause();
    } else {
      play();
    }
  };

  const retryOnGesture = () => {
    if (automatic && needsGesture && !blocked) play();
  };

  return { available, playing, needsGesture, toggle, retryOnGesture };
}
