import { useEffect, useRef } from 'react';
import { useSocket } from './useSocket';
import type { Conversacion } from '@shared/types/conversacion';

const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2Mi4x3aGdwfIeNj4N1amZ0gIyRjoR2a2l1g4+UjYJ1a2p3ho+Tj4F2bGx5iJGUjX93bm17ipOVi3x3b3B9i5OVin14cHJ/jJWVinx5cXOAjZaVinx5cnSBjpaVint5c3WCj5WUiXt5dHaDj5WUiHt6dXeEkJSUiHt7dniFkJSUh3t7d3mGkJOTh3x8eHqHkZOShnx9eXuIkZKRhn1+enyJkZKRhX5/e3yKkpGQhX5/fH2LkpCPhX+AfX6Mk4+OhYCBfn+Nk46NhYGCf4COlI2MhIKDgIGPlIyLhIOEgYKQlIuJg4SFgoOQlIqIg4WGg4SRlImHgoaHhIWSlIiGgoiIhYaTk4eFgoiJhoeTk4aEgomKh4iTkoWDg4qLiImTkYSDhIuMiYqUkIODhYyNiouUj4KDho2OioyUjYGDh46PjI2VjICDiI+QjY6VjH+DiZCRjo+Wi36Ei5GSj5CXin2EjJKTkJKYiXyFjZOUkZOYiHuGjpSVk5SZh3qHj5WWlJWah3mIkJeXlZaaeHiJkZiYlpebd3eKkpmZl5icdnaLk5qamZmddXWMlJubmpqedHSNlZycm5ufc3OOlp2dnJyfc3KPl56enZ2gcnGQmJ+fnp6hcXCSmaChoKCicG+TmqKhoaGicG6Um6OioqKjb22VnKSjo6OkbmyWnaSjo6SkbWuXnqWkpKWlbGqYn6alpaalameZoKempqena2aaoainp6eoa2Wbo6moqKiqamSkpKqpqamqa2Olpauqqqmsb2WmpayrqqqtcGenpqytrKuucm2np62urq2wdG+oqK6vrq+ydXCpqa+wr7C0eHKqqrCxsLG2fHWrrLGysrO4f3itrLKzs7W6gnuurrO0tLe8hX6wrrS1tbnAiIKxr7a2t7vDi4Wys7e4uL3Gj4i0tLi5ur/JkYu1tri7vMLMlI63t7q8vsTPlpC5ubu9wMfSmZK6ur2/wsnVnJS7vL7Aw8vYnpe9vb/CxM3boJm+vsHDxs/cpJvAv8LFyNHfp53Bv8PHydPiq6DCwcTIy9Xkr6PDwsXKzdfnsajFw8bLztntua3GxMjN0Nvxv7HIxcnP0t31xbbKxsrR1eD5yrjLyMzT1+P9z7vNyczU2ub/0r3Oys7V2+gA1b/Qy8/X3esC2MLS';

let notificationPermission: NotificationPermission = 'default';

function requestPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return;
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      notificationPermission = perm;
    });
  }
}

function playSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // Audio not supported
  }
}

function sendNotification(title: string, body: string) {
  if (notificationPermission !== 'granted') return;
  if (document.hasFocus()) return; // Don't notify if tab is focused

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      tag: 'chatbot-notification',
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Notification not supported
  }
}

export function useNotifications() {
  const socket = useSocket();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      requestPermission();
      initialized.current = true;
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewConv = (conv: Conversacion) => {
      if (conv.estado === 'espera_humano') {
        playSound();
        const nombre = conv.huesped?.nombre ?? conv.huesped?.waId ?? 'Nuevo huesped';
        sendNotification(
          'Nueva conversacion en espera',
          `${nombre} necesita atencion`,
        );
      }
    };

    const handleUpdatedConv = (conv: Conversacion) => {
      if (conv.estado === 'espera_humano') {
        playSound();
        const nombre = conv.huesped?.nombre ?? conv.huesped?.waId ?? 'Huesped';
        sendNotification(
          'Conversacion escalada',
          `${nombre} fue escalada a atencion humana`,
        );
      }
    };

    socket.on('conversacion:nueva', handleNewConv);
    socket.on('conversacion:actualizada', handleUpdatedConv);

    return () => {
      socket.off('conversacion:nueva', handleNewConv);
      socket.off('conversacion:actualizada', handleUpdatedConv);
    };
  }, [socket]);
}
