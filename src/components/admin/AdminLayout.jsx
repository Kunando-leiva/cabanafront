// components/admin/AdminLayout.js
import  AdminNav  from './AdminNav';

export const AdminLayout = ({ children }) => {
  return (
    <div>
      <AdminNav />
      <main>{children}</main>
    </div>
  );
};