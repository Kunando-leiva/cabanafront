// src/Test.jsx
import { useAuth } from './context/AuthContext';

export default function Test() {
  const { user } = useAuth();
  return <div>User: {JSON.stringify(user)}</div>;
}