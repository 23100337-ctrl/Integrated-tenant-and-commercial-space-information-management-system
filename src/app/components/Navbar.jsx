import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import mannaLogo from '../images/manna_logo.png';

// Navbar component — logo only, user profile has moved to the Sidebar
export function Navbar() {
  const { user } = useAuth();

  // Get dashboard link based on user role
  const getDashboardLink = () => {
    if (!user) return '/';
    return `/${user.role}`;
  };

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm w-full min-w-[320px]">
      <div className="mx-auto w-full px-2 sm:px-4 lg:px-6">
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3">
          {/* Logo */}
          <img 
            src={mannaLogo} 
            alt="Company Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain flex-shrink-0"
          />

          {/* Brand name & subtitle */}
          <Link to={getDashboardLink()} className="flex flex-col flex-shrink-0">
            <span className="font-bold text-sm sm:text-base text-[#2E3192] leading-tight whitespace-nowrap">
              LA Union Sky Mall
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500 leading-tight whitespace-nowrap hidden xs:inline">
              Integrated Tenant & Commercial Space Management
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}