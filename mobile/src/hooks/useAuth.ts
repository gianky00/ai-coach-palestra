import { useContext } from 'react';

import { AuthContext } from '../lib/AuthContext';

export const useAuth = () => useContext(AuthContext);
