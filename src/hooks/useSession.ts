import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../config/firebase';

export const useSession = () => {
  const { setCurrentUser } = useAuth();

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        };
        localStorage.setItem('auth_user', JSON.stringify(userData));
        setCurrentUser(userData);
      } else {
        localStorage.removeItem('auth_user');
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser]);
};