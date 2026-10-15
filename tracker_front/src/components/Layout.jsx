import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = ({ onLogout, user }) => {
    return (
        <div className="app-shell min-h-screen">
            <Navbar user={user} onLogout={onLogout} />
            <main>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;